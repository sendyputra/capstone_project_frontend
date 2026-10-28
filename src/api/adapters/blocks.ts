import { buka } from '@/api/client'
import type { UnitBlockRow } from '@/api/types'

/* Blok dari server memakai tanggal ISO; nilai lain jatuh ke string kosong
   supaya baris tetap tampil sebagai data cacat, bukan tanggal karangan. */
const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/

function keTanggal(nilai: unknown): string {
  return typeof nilai === 'string' && POLA_TANGGAL.test(nilai) ? nilai : ''
}

export function keBlok(dto: unknown): UnitBlockRow {
  const b = (dto ?? {}) as Record<string, unknown>
  return {
    id: Number(b.id),
    unit_id: Number(b.unit_id),
    start_date: keTanggal(b.start_date),
    end_date: keTanggal(b.end_date),
    note: String(b.note ?? ''),
  }
}

export function keDaftarBlok(muatan: unknown): UnitBlockRow[] {
  const isi = buka<unknown[]>(muatan)
  return Array.isArray(isi) ? isi.map(keBlok) : []
}
