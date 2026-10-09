import type { Role } from '@/api/types'

/* Nilai atribut `data-role` yang dikenali tokens.css hanya `renter` dan `owner`;
   admin sengaja memakai aksen bawaan. */
export function toDataRole(role: Role): 'renter' | 'owner' | 'admin' {
  if (role === 'penyewa') return 'renter'
  if (role === 'pemilik') return 'owner'
  return 'admin'
}

export function labelPeran(role: Role): string {
  if (role === 'penyewa') return 'Penyewa'
  if (role === 'pemilik') return 'Pemilik'
  return 'Admin'
}
