import type { Booking } from '@/api/types'

/* Di luar ERD: pengajuan sewa belum punya tabelnya di skema; nilainya disalin
   dari `appData().bookings` purwarupa. */
export const bookings: Booking[] = [
  { id: 101, unit_id: 1, tenant_id: 1, duration: '1 Bulan (Mulai 10 Okt)', status: 'Menunggu Persetujuan' },
  { id: 102, unit_id: 2, tenant_id: 2, duration: '6 Bulan', status: 'Disetujui' },
]
