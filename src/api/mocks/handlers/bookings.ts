import { http, HttpResponse } from 'msw'
import { bookings } from '@/api/mocks/data/bookings'
import { tenants } from '@/api/mocks/data/tenants'
import { subDariToken } from '@/api/mocks/token'
import { gagalSekali } from '@/api/mocks/handlers/simulasi'
import { tenantById, unitById } from '@/api/mocks/join'
import type { Booking, BookingRow } from '@/api/types'

function barisPengajuan(pengajuan: Booking): BookingRow {
  const tenant = tenantById(pengajuan.tenant_id)
  return {
    ...pengajuan,
    renter_name: tenant?.name ?? 'Tanpa penyewa',
    unit_title: unitById(pengajuan.unit_id)?.name ?? 'Unit terhapus',
    renter_phone: tenant?.phone ?? '',
  }
}

export const bookingHandlers = [
  http.get('/bookings', ({ request }) => {
    const sub = subDariToken(request.headers.get('Authorization')) ?? 402
    /* Pengajuan milik unit pemanggil saja; admin melihat semuanya. */
    const milikPemanggil = bookings.filter((pengajuan) => unitById(pengajuan.unit_id)?.owner_id === sub)
    return HttpResponse.json({ data: (sub === 401 ? bookings : milikPemanggil).map(barisPengajuan) })
  }),

  http.patch('/bookings/:id', async ({ params, request }) => {
    const pengajuan = bookings.find((kandidat) => kandidat.id === Number(params.id))
    if (!pengajuan) return HttpResponse.json({ message: 'Pengajuan tidak ditemukan.' }, { status: 404 })
    const { status } = (await request.json()) as Pick<Booking, 'status'>
    pengajuan.status = status
    return HttpResponse.json({ data: barisPengajuan(pengajuan) })
  }),

  http.post('/bookings', async ({ request }) => {
    const { unit_id, duration } = (await request.json()) as { unit_id: number; duration?: string }
    if (gagalSekali('POST /bookings')) {
      return HttpResponse.json({ message: 'Pengajuan gagal terkirim karena koneksi terputus. Periksa jaringan, lalu coba lagi.' }, { status: 500 })
    }
    const sub = subDariToken(request.headers.get('Authorization'))
    const tenant = tenants.find((kandidat) => kandidat.user_id === sub)
    const pengajuan: Booking = {
      id: 100 + bookings.length + 1,
      unit_id,
      tenant_id: tenant?.id ?? 1,
      duration: duration ?? '1 Bulan',
      status: 'Menunggu Persetujuan',
    }
    bookings.push(pengajuan)
    return HttpResponse.json({ data: barisPengajuan(pengajuan) }, { status: 201 })
  }),
]
