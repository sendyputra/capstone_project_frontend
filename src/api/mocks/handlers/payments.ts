import { http, HttpResponse, type HttpResponseResolver } from 'msw'
import { keKontrak } from '@/api/adapters/contracts'
import { kePembayaran } from '@/api/adapters/payments'
import { kirimCsv } from '@/api/mocks/csv'
import { contracts, type ContractDto } from '@/api/mocks/data/contracts'
import { payments, type PaymentDto } from '@/api/mocks/data/payments'
import { tenants } from '@/api/mocks/data/tenants'
import { barisKontrak } from '@/api/mocks/handlers/contracts'
import { gagalSekali } from '@/api/mocks/handlers/simulasi'
import { pemanggil, tenantByUserId, unitById } from '@/api/mocks/join'
import { namaBerkas } from '@/lib/format'
import { susunTagihan } from '@/lib/tagihan'
import { tanggalHariIni } from '@/lib/tanggal'

export type PaymentDtoRow = PaymentDto & { renter_name: string; unit_title: string }

function kontrakDari(pembayaran: PaymentDto): ContractDto | undefined {
  return contracts.find((kontrak) => kontrak.id === pembayaran.contract_id)
}

/* Tanggal (`month`) dikirim apa adanya dalam format ERD `YYYY-MM` — label
   "Oktober 2026" urusan tampilan, bukan bentuk data. */
export function barisTagihan(pembayaran: PaymentDto): PaymentDtoRow {
  const kontrak = kontrakDari(pembayaran)
  const tenant = kontrak ? tenants.find((kandidat) => kandidat.id === kontrak.tenant_id) : undefined
  const unit = kontrak ? unitById(kontrak.unit_id) : undefined
  return { ...pembayaran, renter_name: tenant?.name ?? '', unit_title: unit?.name ?? '' }
}

const ubahPembayaran: HttpResponseResolver<{ id: string }> = async ({ params, request }) => {
  const pembayaran = payments.find((kandidat) => kandidat.id === Number(params.id))
  if (!pembayaran) return HttpResponse.json({ message: 'Tagihan tidak ditemukan.' }, { status: 404 })
  const { status } = (await request.json()) as Pick<PaymentDto, 'status'>
  pembayaran.status = status
  if (status === 'rejected') pembayaran.proof_url = ''
  return HttpResponse.json({ data: barisTagihan(pembayaran) })
}

export const paymentHandlers = [
  /* Laporan tagihan dibentuk dari kontrak + pembayaran terbaru, bukan dari baris
     pembayaran mentah — bulan yang belum dibayar tidak punya baris dan tetap
     harus muncul. `barisKontrak` masih membawa status enum backend (`active`),
     sedangkan `susunTagihan` menyaring `Aktif`; `keKontrak` menerjemahkannya
     sekaligus menghitung biaya bulanan dengan aturan yang sama seperti backend. */
  http.get('/payments/export', ({ request }) => {
    const { sub, peran } = pemanggil(request)
    if (!peran) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const terpilih =
      peran === 'penyewa'
        ? contracts.filter((kontrak) => kontrak.tenant_id === tenantByUserId(sub)?.id)
        : peran === 'pemilik'
          ? contracts.filter((kontrak) => unitById(kontrak.unit_id)?.owner_id === sub)
          : []

    const kontrak = terpilih.map((baris) => keKontrak(barisKontrak(baris)))
    const tagihan = susunTagihan(kontrak, payments.map((baris) => kePembayaran(barisTagihan(baris))), tanggalHariIni())
    const petaKontrak = new Map(kontrak.map((baris) => [baris.id, baris]))

    const kolom =
      peran === 'penyewa'
        ? ['Bulan', 'Unit', 'Pemilik', 'Jumlah', 'Status', 'Bukti', 'Diunggah']
        : ['Bulan', 'Unit', 'Penyewa', 'Jumlah', 'Status', 'Bukti', 'Diunggah']

    const diunggah = (contractId: number, month: string) => {
      const baris = payments.find((pembayaran) => pembayaran.contract_id === contractId && pembayaran.month === month)
      return baris ? (baris.created_at ?? `${month}-01 00:00`) : ''
    }

    const isi = tagihan.map((baris) => {
      const induk = petaKontrak.get(baris.contract_id)!
      return [
        baris.month,
        baris.unit_title,
        peran === 'penyewa' ? induk.owner_name : induk.renter_name,
        baris.amount,
        baris.status,
        namaBerkas(baris.proof_url),
        diunggah(baris.contract_id, baris.month),
      ]
    })

    return kirimCsv('laporan-tagihan', kolom, isi)
  }),

  http.get('/payments', ({ request }) => {
    const { sub, peran } = pemanggil(request)

    /* Cakupan dari peran token: penyewa hanya tagihannya, pemilik tagihan unit
       miliknya. Pengunjung dan peran lain melihat seluruhnya. */
    if (peran === 'penyewa') {
      const milik = payments.filter((pembayaran) => {
        const kontrak = kontrakDari(pembayaran)
        return tenants.find((tenant) => tenant.id === kontrak?.tenant_id)?.user_id === sub
      })
      return HttpResponse.json({ data: milik.map(barisTagihan) })
    }
    if (peran === 'pemilik') {
      const milik = payments.filter((pembayaran) => unitById(kontrakDari(pembayaran)?.unit_id ?? 0)?.owner_id === sub)
      return HttpResponse.json({ data: milik.map(barisTagihan) })
    }
    return HttpResponse.json({ data: payments.map(barisTagihan) })
  }),

  /* Unggah bukti bayar: `multipart/form-data`, seperti rute API asli. Nomor
     kontrak tidak dicocokkan ke tabel kontrak — mock menerima id berbentuk angka
     apa pun; kontrak yang tidak ada hanya membuat baris join tanpa nama penyewa
     atau unit. Backend asli yang menegakkan `exists:contracts,id`.
     Bagian berkas diperiksa dari bentuknya, bukan lewat `instanceof File`:
     kelas `File` di lingkungan uji (jsdom) berbeda realm dari kelas yang dipakai
     parser multipart, sehingga `instanceof` di sini menolak unggahan yang sah. */
  http.post('/payments', async ({ request }) => {
    const badan = await request.formData()
    const kontrakId = Number(badan.get('contract_id'))
    const bulan = String(badan.get('month') ?? '')
    const jumlah = Number(badan.get('amount'))
    const berkas = badan.get('proof')
    if (!kontrakId || !bulan || !jumlah || !berkas || typeof berkas === 'string') {
      return HttpResponse.json({ message: 'Periksa isian.', errors: { proof: ['Bukti bayar wajib diunggah.'] } }, { status: 422 })
    }
    /* Simulasi kegagalan sekali per aksi, supaya jalur galat dan tombol coba
       ulang tetap bisa didemokan setelah rute unggah pindah ke sini. */
    if (gagalSekali('POST /payments')) {
      return HttpResponse.json({ message: 'Bukti bayar gagal diunggah karena koneksi terputus. Periksa jaringan, lalu coba lagi.' }, { status: 500 })
    }
    /* Id baru dihitung dari id tertinggi yang hidup, bukan panjang array: data
       contoh ber-id 302–305, sehingga `payments.length + 1` memberi baris baru
       id 5 dan `susunTagihan` — yang memakai baris ber-id terbesar per bulan —
       tetap menampilkan baris lama yang ditolak. Unggah ulang jadi tampak tidak
       terjadi apa-apa. */
    const baris: PaymentDto = {
      id: Math.max(0, ...payments.map((kandidat) => kandidat.id)) + 1,
      contract_id: kontrakId,
      month: bulan,
      amount: jumlah,
      status: 'pending',
      proof_url: `/bukti/${berkas.name}`,
    }
    payments.push(baris)
    return HttpResponse.json({ data: baris }, { status: 201 })
  }),

  /* `useVerifikasiPembayaran` mengirim PUT; mock hanya melayani PUT supaya
     adaptor yang kembali ke PATCH gagal di sini, bukan diam-diam lolos. */
  http.put('/payments/:id', ubahPembayaran),
]
