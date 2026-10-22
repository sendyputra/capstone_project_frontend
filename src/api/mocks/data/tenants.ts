import type { Tenant } from '@/api/types'

/* Penyewa bisa punya akun (`user_id`) atau tidak — ERD membolehkan keduanya;
   tiga nama kontrak di purwarupa memang tidak ada di daftar pengguna. */
export const tenants: Tenant[] = [
  { id: 1, user_id: 404, name: 'Rian Pratama', phone: '628123456789', ktp: 'Menunggu', joined: '1 Okt 2026' },
  { id: 2, user_id: 405, name: 'Siti Sarah', phone: '628987654321', ktp: 'Terverifikasi', joined: '3 Okt 2026' },
  { id: 3, user_id: null, name: 'Dewi Lestari', phone: '628570000003', ktp: 'Terverifikasi', joined: '2 Jul 2026' },
  { id: 4, user_id: null, name: 'Bagas Nugroho', phone: '628570000004', ktp: 'Terverifikasi', joined: '20 Jan 2026' },
  { id: 5, user_id: null, name: 'Ayu Kartika', phone: '628570000005', ktp: 'Menunggu', joined: '25 Apr 2026' },
  { id: 6, user_id: 409, name: 'Fajar Nugraha', phone: '628170000009', ktp: 'Menunggu', joined: '5 Okt 2026' },
  { id: 7, user_id: 410, name: 'Nabila Putri', phone: '628180000010', ktp: 'Terverifikasi', joined: '6 Okt 2026' },
  { id: 8, user_id: 411, name: 'Rizky Ramadhan', phone: '628190000011', ktp: 'Terverifikasi', joined: '7 Okt 2026' },
  { id: 9, user_id: 412, name: 'Maya Sari', phone: '628110000012', ktp: 'Menunggu', joined: '8 Okt 2026' },
  { id: 10, user_id: 413, name: 'Dimas Prakoso', phone: '628120000013', ktp: 'Terverifikasi', joined: '9 Okt 2026' },
  { id: 11, user_id: 414, name: 'Ayu Lestari', phone: '628130000014', ktp: 'Belum', joined: '10 Okt 2026' },
  { id: 12, user_id: 415, name: 'Bayu Saputra', phone: '628140000015', ktp: 'Terverifikasi', joined: '11 Okt 2026' },
  { id: 13, user_id: 416, name: 'Intan Permata', phone: '628150000016', ktp: 'Menunggu', joined: '12 Okt 2026' },
]
