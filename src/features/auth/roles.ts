import type { Role } from '@/api/types'

/* Nilai atribut `data-role` yang dikenali tokens.css hanya `renter` dan `owner`. */
export function toDataRole(role: Role): 'renter' | 'owner' {
  return role === 'penyewa' ? 'renter' : 'owner'
}

export function labelPeran(role: Role): string {
  return role === 'penyewa' ? 'Penyewa' : 'Pemilik'
}

/* Subjudul avatar di bilah atas, seperti purwarupa: sebutan pekerjaan, bukan
   sekadar nama peran. */
export function jabatanPeran(role: Role): string {
  return role === 'penyewa' ? 'Penyewa' : 'Pemilik Kos & Kontrakan'
}
