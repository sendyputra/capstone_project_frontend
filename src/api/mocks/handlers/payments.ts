import { http, HttpResponse, type HttpResponseResolver } from 'msw'
import { contracts, type ContractDto } from '@/api/mocks/data/contracts'
import { payments, type PaymentDto } from '@/api/mocks/data/payments'
import { tenants } from '@/api/mocks/data/tenants'
import { gagalSekali } from '@/api/mocks/handlers/simulasi'
import { pemanggil, unitById } from '@/api/mocks/join'

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
     atau unit. Backend asli yang menegakkan `exists:contracts,id`. */
  http.post('/payments', async ({ request }) => {
    const badan = await request.formData()
    const kontrakId = Number(badan.get('contract_id'))
    const bulan = String(badan.get('month') ?? '')
    const jumlah = Number(badan.get('amount'))
    const berkas = badan.get('proof')
    if (!kontrakId || !bulan || !jumlah || !(berkas instanceof File)) {
      return HttpResponse.json({ message: 'Periksa isian.', errors: { proof: ['Bukti bayar wajib diunggah.'] } }, { status: 422 })
    }
    /* Simulasi kegagalan sekali per aksi, supaya jalur galat dan tombol coba
       ulang tetap bisa didemokan setelah rute unggah pindah ke sini. */
    if (gagalSekali('POST /payments')) {
      return HttpResponse.json({ message: 'Bukti bayar gagal diunggah karena koneksi terputus. Periksa jaringan, lalu coba lagi.' }, { status: 500 })
    }
    const baris: PaymentDto = { id: payments.length + 1, contract_id: kontrakId, month: bulan, amount: jumlah, status: 'pending', proof_url: `/bukti/${berkas.name}` }
    payments.push(baris)
    return HttpResponse.json({ data: baris }, { status: 201 })
  }),

  /* `useVerifikasiPembayaran` mengirim PUT; mock hanya melayani PUT supaya
     adaptor yang kembali ke PATCH gagal di sini, bukan diam-diam lolos. */
  http.put('/payments/:id', ubahPembayaran),
]
