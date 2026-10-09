import { units } from '@/api/mocks/data/units'
import { users } from '@/api/mocks/data/users'
import { tenants } from '@/api/mocks/data/tenants'
import type { Unit, UnitRow } from '@/api/types'

export function unitById(id: number) {
  return units.find((unit) => unit.id === id)
}

export function tenantById(id: number) {
  return tenants.find((tenant) => tenant.id === id)
}

export function penggunaById(id: number | null) {
  return users.find((pengguna) => pengguna.id === id)
}

export function namaPengguna(id: number | null): string {
  return penggunaById(id)?.name ?? 'Tanpa akun'
}

export function barisUnit(unit: Unit): UnitRow {
  return { ...unit, owner_name: namaPengguna(unit.owner_id) }
}

/* Masa sewa dalam bulan, dari tanggal ISO ERD. Purwarupa menuliskan "6 bulan";
   dihitung, bukan disimpan, supaya tidak ada dua sumber untuk satu nilai. */
export function termBulan(mulai: string, selesai: string): string {
  const hari = (new Date(selesai).getTime() - new Date(mulai).getTime()) / 86_400_000
  return `${Math.max(1, Math.round(hari / 30))} bulan`
}

const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export function labelBulan(bulan: string): string {
  const [tahun, nomor] = bulan.split('-')
  return `${namaBulan[Number(nomor) - 1]} ${tahun}`
}
