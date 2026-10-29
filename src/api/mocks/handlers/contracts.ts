import { http, HttpResponse, type HttpResponseResolver } from 'msw'
import { keKontrak } from '@/api/adapters/contracts'
import { kirimCsv } from '@/api/mocks/csv'
import { halamanLaravel } from '@/api/mocks/halaman'
import { contracts, type ContractDto } from '@/api/mocks/data/contracts'
import { namaPengguna, pemanggil, tenantById, tenantByUserId, termBulan, unitById } from '@/api/mocks/join'
import type { KtpStatus } from '@/api/types'

/* Status verifikasi KTP milik penyewa ikut pada baris kontrak: layar pemilik
   menampilkannya sebagai kolom "KTP", dan tanpa ini kolom itu selalu "Belum". */
export type ContractDtoRow = ContractDto & {
  renter_name: string
  unit_title: string
  owner_name: string
  term: string
  monthly: number
  ktp: KtpStatus
}

export function barisKontrak(kontrak: ContractDto): ContractDtoRow {
  const unit = unitById(kontrak.unit_id)
  const tenant = tenantById(kontrak.tenant_id)
  return {
    ...kontrak,
    renter_name: tenant?.name ?? 'Tanpa penyewa',
    unit_title: unit?.name ?? 'Unit terhapus',
    owner_name: unit ? namaPengguna(unit.owner_id) : 'Tanpa pemilik',
    term: termBulan(kontrak.start_date, kontrak.end_date),
    monthly: unit?.price ?? 0,
    ktp: tenant?.ktp ?? 'Belum',
  }
}

const ubahKontrak: HttpResponseResolver<{ id: string }> = async ({ params, request }) => {
  const kontrak = contracts.find((kandidat) => kandidat.id === Number(params.id))
  if (!kontrak) return HttpResponse.json({ message: 'Kontrak tidak ditemukan.' }, { status: 404 })
  const { status } = (await request.json()) as Pick<ContractDto, 'status'>
  kontrak.status = status
  return HttpResponse.json({ data: barisKontrak(kontrak) })
}

let urutan = Math.max(...contracts.map((kontrak) => kontrak.id))

type MasukanKontrak = { tenant_id?: unknown; unit_id?: unknown; start_date?: unknown; end_date?: unknown; total_price?: unknown }

function tanggalSah(nilai: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(nilai) && !Number.isNaN(new Date(nilai).getTime())
}

/* Pengajuan sewa baru selalu masuk sebagai `pending`: pemilik yang mengaktifkan.
   Penyewa yang mengajukan sendiri diambil dari token; pemilik wajib memilih
   `tenant_id` penyewa yang ia kelola, dan unitnya harus miliknya. */
const buatKontrak: HttpResponseResolver = async ({ request }) => {
  const { sub, peran } = pemanggil(request)
  if (!peran) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
  if (peran !== 'pemilik' && peran !== 'penyewa') return HttpResponse.json({ message: 'Unauthorized access' }, { status: 403 })

  const badan = (await request.json()) as MasukanKontrak
  const unitId = Number(badan.unit_id)
  const mulai = String(badan.start_date ?? '')
  const selesai = String(badan.end_date ?? '')
  const total = Number(badan.total_price)

  const galat: Record<string, string> = {}
  if (!unitById(unitId)) galat.unit_id = 'Unit tidak ditemukan.'
  if (!tanggalSah(mulai)) galat.start_date = 'Tanggal mulai wajib berupa tanggal yang sah.'
  if (!tanggalSah(selesai)) galat.end_date = 'Tanggal selesai wajib berupa tanggal yang sah.'
  else if (tanggalSah(mulai) && selesai < mulai) galat.end_date = 'Tanggal selesai harus setelah tanggal mulai.'
  if (!Number.isFinite(total) || total <= 0) galat.total_price = 'Total harga wajib lebih dari nol.'
  if (Object.keys(galat).length > 0) return HttpResponse.json({ message: 'Periksa isian.', errors: galat }, { status: 422 })

  const unit = unitById(unitId)!
  let tenantId = 0
  if (peran === 'pemilik') {
    const tenant = tenantById(Number(badan.tenant_id))
    if (!tenant) return HttpResponse.json({ message: 'Penyewa tidak ditemukan.' }, { status: 422 })
    if (unit.owner_id !== sub || tenant.owner_id !== sub) {
      return HttpResponse.json({ message: 'Unauthorized access' }, { status: 403 })
    }
    tenantId = tenant.id
  } else {
    tenantId = tenantByUserId(sub)?.id ?? 0
  }

  if (unit.booked_dates.some((tanggal) => tanggal >= mulai && tanggal <= selesai)) {
    return HttpResponse.json({ message: 'Tanggal yang dipilih sudah terisi atau diblokir.' }, { status: 422 })
  }

  const kontrak: ContractDto = {
    id: ++urutan,
    unit_id: unitId,
    tenant_id: tenantId,
    start_date: mulai,
    end_date: selesai,
    total_price: total,
    status: 'pending',
  }
  contracts.push(kontrak)
  return HttpResponse.json({ data: barisKontrak(kontrak) }, { status: 201 })
}

export const contractHandlers = [
  /* Laporan kontrak memuat semua status, cakupannya tetap unit milik pemilik.
     Baris memakai `term` dan `monthly` hasil adaptor supaya durasi dan biaya
     bulanan tidak dihitung ulang dengan aturan berbeda. */
  http.get('/contracts/export', ({ request }) => {
    const { sub, peran } = pemanggil(request)
    if (!peran) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
    if (peran !== 'pemilik') return HttpResponse.json({ message: 'Unauthorized access' }, { status: 403 })

    const baris = contracts
      .filter((kontrak) => unitById(kontrak.unit_id)?.owner_id === sub)
      .map((kontrak) => keKontrak(barisKontrak(kontrak)))
      .map((kontrak) => [
        kontrak.id,
        kontrak.renter_name,
        kontrak.unit_title,
        kontrak.owner_name,
        kontrak.start_date,
        kontrak.end_date,
        kontrak.term,
        kontrak.monthly,
        kontrak.total_price,
        kontrak.status,
      ])

    return kirimCsv(
      'laporan-kontrak',
      ['ID', 'Penyewa', 'Unit', 'Pemilik', 'Mulai', 'Selesai', 'Durasi', 'Harga per Bulan', 'Nilai Kontrak', 'Status'],
      baris,
    )
  }),

  /* Cakupan dari token, sama seperti `GET /payments`: pemilik hanya kontrak yang
     unitnya miliknya, penyewa hanya kontrak atas namanya sendiri. Cakupan penyewa
     bukan hiasan — tagihan diturunkan dari kontrak, jadi kontrak yang bocor ikut
     membocorkan tagihan penyewa lain. Pengunjung melihat seluruhnya. */
  http.get('/contracts', ({ request }) => {
    const { sub, peran } = pemanggil(request)
    const data =
      peran === 'pemilik'
        ? contracts.filter((kontrak) => unitById(kontrak.unit_id)?.owner_id === sub)
        : peran === 'penyewa'
          ? contracts.filter((kontrak) => kontrak.tenant_id === tenantByUserId(sub)?.id)
          : contracts
    return halamanLaravel(request, data.map(barisKontrak))
  }),

  http.post('/contracts', buatKontrak),

  /* `useUbahStatusKontrak` mengirim PUT; mock hanya melayani PUT supaya adaptor
     yang kembali ke PATCH gagal di sini, bukan diam-diam lolos. */
  http.put('/contracts/:id', ubahKontrak),
]
