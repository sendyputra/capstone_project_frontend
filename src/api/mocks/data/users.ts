import type { User } from '@/api/types'

export const users: User[] = [
  { id: 401, name: 'Admin Nusantara', email: 'admin@nusantarabooking.id', role: 'admin', phone: '628110000001', city: 'Bandung', joined: '22 Sep 2026' },
  { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik', phone: '628120000002', city: 'Bandung Barat', joined: '24 Sep 2026' },
  { id: 403, name: 'Bu Rina', email: 'rina@umkm.id', role: 'pemilik', phone: '628130000003', city: 'Cimahi', joined: '26 Sep 2026' },
  { id: 404, name: 'Rian Pratama', email: 'rian@mail.com', role: 'penyewa', phone: '628123456789', city: 'Bandung', joined: '1 Okt 2026' },
  { id: 405, name: 'Siti Sarah', email: 'sarah@mail.com', role: 'penyewa', phone: '628987654321', city: 'Cimahi', joined: '3 Okt 2026' },
]
