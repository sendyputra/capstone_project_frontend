import type { Tenant } from '@/api/types'

/* Penyewa bisa punya akun (`user_id`) atau tidak — ERD membolehkan keduanya;
   tiga nama kontrak di purwarupa memang tidak ada di daftar pengguna. */
export const tenants: Tenant[] = [
  { id: 1, user_id: 404, name: 'Rian Pratama', phone: '628123456789', ktp: 'Menunggu', joined: '1 Okt 2026' },
  { id: 2, user_id: 405, name: 'Siti Sarah', phone: '628987654321', ktp: 'Terverifikasi', joined: '3 Okt 2026' },
  { id: 3, user_id: null, name: 'Dewi Lestari', phone: '628570000003', ktp: 'Terverifikasi', joined: '2 Jul 2026' },
  { id: 4, user_id: null, name: 'Bagas Nugroho', phone: '628570000004', ktp: 'Terverifikasi', joined: '20 Jan 2026' },
  { id: 5, user_id: null, name: 'Ayu Kartika', phone: '628570000005', ktp: 'Menunggu', joined: '25 Apr 2026' },
]
