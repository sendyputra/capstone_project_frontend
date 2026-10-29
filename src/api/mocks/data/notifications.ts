import type { NotificationRow } from '@/api/types'

/* Notifikasi in-app yang dikirim penjadwal pengingat tagihan. `user_id` hanya
   ada di data contoh — API asli membatasi baris dari token, bukan dari kolom
   ini. */
export type NotificationDto = NotificationRow & { user_id: number }

export const notifications: NotificationDto[] = [
  {
    id: 'n-405-1',
    user_id: 405,
    type: 'bill_reminder',
    message: 'Tagihan November 2026 sebesar Rp2.500.000 akan jatuh tempo.',
    month: '2026-11',
    amount: 2500000,
    contract_id: 205,
    read_at: null,
    created_at: '2026-10-28T08:00:00+00:00',
  },
  {
    id: 'n-405-2',
    user_id: 405,
    type: 'bill_reminder',
    message: 'Tagihan Oktober 2026 sebesar Rp2.500.000 belum dibayar.',
    month: '2026-10',
    amount: 2500000,
    contract_id: 201,
    read_at: null,
    created_at: '2026-10-27T08:00:00+00:00',
  },
  {
    id: 'n-402-1',
    user_id: 402,
    type: 'bill_reminder',
    message: 'Tagihan Oktober 2026 dari Siti Sarah sebesar Rp2.500.000 belum dibayar.',
    month: '2026-10',
    amount: 2500000,
    contract_id: 201,
    read_at: null,
    created_at: '2026-10-27T08:00:00+00:00',
  },
]
