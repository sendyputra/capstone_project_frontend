import { buka } from '@/api/client'
import type { UnitRow, UnitStatus, UnitStatusDto, UnitType } from '@/api/types'

/* Satu tabel per arah: `STATUS` menerjemahkan enum backend ke label tampilan,
   `DARI_STATUS` sebaliknya. Keduanya dijaga tipe, jadi menambah status tampilan
   tanpa menambah padanan backend tidak lolos typecheck. */
const STATUS: Record<string, UnitStatus> = {
  available: 'Tersedia',
  rented: 'Terisi',
  maintenance: 'Perawatan',
}

const DARI_STATUS: Record<UnitStatus, UnitStatusDto> = {
  Tersedia: 'available',
  Terisi: 'rented',
  Perawatan: 'maintenance',
}

const TIPE: UnitType[] = ['Kamar Kos', 'Kontrakan', 'Ruang Usaha', 'Apartemen']

/* Nilai di luar enum backend jatuh ke `Tersedia`, bukan diteruskan mentah —
   status asing tak boleh menyamar jadi status sah. */
export function keStatusUnit(nilai: string): UnitStatus {
  return STATUS[nilai] ?? 'Tersedia'
}

export function dariStatusUnit(nilai: UnitStatus): UnitStatusDto {
  return DARI_STATUS[nilai] ?? 'available'
}

function keTipe(nilai: unknown): UnitType {
  return TIPE.find((tipe) => tipe === nilai) ?? 'Kamar Kos'
}

function keHarga(nilai: unknown): number {
  const harga = Number(nilai ?? 0)
  return Number.isFinite(harga) ? harga : 0
}

/* `UnitRow.booked_dates` bertipe `number[]` (nomor hari pada kalender). DTO
   backend bisa mengirim tanggal ISO; entri yang bukan angka dibuang, bukan
   dipaksa menjadi NaN. */
function keTanggalTerisi(nilai: unknown): number[] {
  if (!Array.isArray(nilai)) return []
  return nilai.flatMap((baris) => {
    const angka = typeof baris === 'number' ? baris : typeof baris === 'string' && baris.trim() !== '' ? Number(baris) : Number.NaN
    return Number.isFinite(angka) ? [angka] : []
  })
}

function keDaftarTeks(nilai: unknown): string[] {
  return Array.isArray(nilai) ? nilai.map(String) : []
}

export function keUnit(dto: unknown): UnitRow {
  const baris = (dto ?? {}) as Record<string, unknown>
  return {
    id: Number(baris.id),
    owner_id: Number(baris.owner_id ?? 0),
    name: String(baris.name ?? ''),
    address: String(baris.address ?? ''),
    price: keHarga(baris.price),
    status: keStatusUnit(String(baris.status)),
    type: keTipe(baris.type),
    facilities: keDaftarTeks(baris.facilities),
    image: String(baris.image ?? ''),
    booked_dates: keTanggalTerisi(baris.booked_dates),
    owner_name: String(baris.owner_name ?? (baris.owner as { name?: unknown } | undefined)?.name ?? ''),
  }
}

export function keDaftarUnit(muatan: unknown): UnitRow[] {
  const isi = buka<unknown[]>(muatan)
  return Array.isArray(isi) ? isi.map(keUnit) : []
}
