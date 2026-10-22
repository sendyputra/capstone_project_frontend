import { units, type UnitDto } from '@/api/mocks/data/units'
import { users } from '@/api/mocks/data/users'
import { tenants } from '@/api/mocks/data/tenants'
import { subDariToken } from '@/api/mocks/token'
import type { Role } from '@/api/types'

export function unitById(id: number) {
  return units.find((unit) => unit.id === id)
}

export function tenantById(id: number) {
  return tenants.find((tenant) => tenant.id === id)
}

/* `user_id` boleh kosong (penyewa tanpa akun), jadi pencarian dengan `null`
   tidak boleh mencocokkan baris yang kebetulan juga kosong. */
export function tenantByUserId(userId: number | null) {
  return userId === null ? undefined : tenants.find((tenant) => tenant.user_id === userId)
}

export function penggunaById(id: number | null) {
  return users.find((pengguna) => pengguna.id === id)
}

export function namaPengguna(id: number | null): string {
  return penggunaById(id)?.name ?? 'Tanpa akun'
}

/* Pemilik pertama pada data contoh; dipakai hanya bila token tidak membawa sub
   yang bisa dibaca (mis. token uji yang dipalsukan). */
const PEMILIK_BAWAAN = 402

export type Pemanggil = { sub: number | null; peran: Role | null }

/* Cakupan baris dibaca dari token, seperti backend asli. Tanpa token berarti
   pengunjung (`sub` dan `peran` kosong); token ada tetapi tak terbaca — token
   uji yang dipalsukan — diperlakukan sebagai pemilik bawaan, supaya tes punya
   cakupan yang jelas. */
export function pemanggil(request: Request): Pemanggil {
  const otorisasi = request.headers.get('Authorization')
  const sub = subDariToken(otorisasi) ?? (otorisasi ? PEMILIK_BAWAAN : null)
  return { sub, peran: sub === null ? null : (penggunaById(sub)?.role ?? null) }
}

export function subPemanggil(request: Request): number {
  return pemanggil(request).sub ?? PEMILIK_BAWAAN
}

/* Baris unit hasil join: bentuknya DTO tabel ditambah nama pemilik, seperti
   relasi `with('owner')` pada API sungguhan. Status tetap enum backend; adaptor
   di frontend yang menerjemahkannya ke label. */
export type UnitDtoRow = UnitDto & { owner_name: string }

export function barisUnit(unit: UnitDto): UnitDtoRow {
  return { ...unit, owner_name: namaPengguna(unit.owner_id) }
}

/* Masa sewa dalam bulan, dari tanggal ISO ERD. Purwarupa menuliskan "6 bulan";
   dihitung, bukan disimpan, supaya tidak ada dua sumber untuk satu nilai. */
export function termBulan(mulai: string, selesai: string): string {
  const hari = (new Date(selesai).getTime() - new Date(mulai).getTime()) / 86_400_000
  return `${Math.max(1, Math.round(hari / 30))} bulan`
}
