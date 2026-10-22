import { buka } from '@/api/client'
import type { UnitRow, UnitStatus, UnitType } from '@/api/types'

/* Dua penulisan diterima selama transisi: enum backend (`available`) dan enum
   tampilan lama (`Tersedia`) yang masih dikirim mock sampai handler DTO selesai. */
const STATUS: Record<string, UnitStatus> = {
  available: 'Tersedia',
  rented: 'Terisi',
  maintenance: 'Perawatan',
  Tersedia: 'Tersedia',
  Terisi: 'Terisi',
  Perawatan: 'Perawatan',
}

const TIPE: UnitType[] = ['Kamar Kos', 'Kontrakan', 'Ruang Usaha', 'Apartemen']

function keStatus(nilai: unknown): UnitStatus {
  return STATUS[String(nilai)] ?? 'Tersedia'
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
    status: keStatus(baris.status),
    type: keTipe(baris.type),
    facilities: keDaftarTeks(baris.facilities),
    image: String(baris.image ?? ''),
    booked_dates: keTanggalTerisi(baris.booked_dates),
    owner_name: String(baris.owner_name ?? ''),
  }
}

export function keDaftarUnit(muatan: unknown): UnitRow[] {
  const isi = buka<unknown[]>(muatan)
  return Array.isArray(isi) ? isi.map(keUnit) : []
}
