import { buka } from '@/api/client'
import type { ContractRow } from '@/api/types'

/* Dua penulisan diterima selama transisi: enum backend (`active`) dan enum
   tampilan lama (`Aktif`) yang masih dikirim dan disimpan mock sampai Task 9
   menulis ulang data contohnya. Nilai di luar keduanya jatuh ke `Menunggu`,
   bukan diteruskan mentah — kontrak asing tak boleh menyamar jadi status sah. */
const STATUS: Record<string, ContractRow['status']> = {
  pending: 'Menunggu',
  active: 'Aktif',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  Menunggu: 'Menunggu',
  Aktif: 'Aktif',
  Selesai: 'Selesai',
  Dibatalkan: 'Dibatalkan',
}

export function keStatusKontrak(nilai: string): ContractRow['status'] {
  return STATUS[nilai] ?? 'Menunggu'
}

export function keKontrak(dto: unknown): ContractRow {
  const k = (dto ?? {}) as Record<string, unknown>
  const total = keAngka(k.total_price)
  const bulan = hitungBulan(String(k.start_date ?? ''), String(k.end_date ?? ''))
  return {
    id: Number(k.id),
    unit_id: Number(k.unit_id),
    tenant_id: Number(k.tenant_id ?? 0),
    start_date: String(k.start_date ?? ''),
    end_date: String(k.end_date ?? ''),
    total_price: total,
    status: keStatusKontrak(String(k.status)),
    renter_name: String(k.renter_name ?? ''),
    unit_title: String(k.unit_title ?? ''),
    owner_name: String(k.owner_name ?? ''),
    term: `${bulan} bulan`,
    /* Biaya bulanan dihitung dari nilai kontrak dan masa sewa, bukan dibaca dari
       `monthly` kiriman server: dua sumber untuk satu angka bisa berselisih. */
    monthly: bulan > 0 ? Math.round(total / bulan) : total,
  }
}

export function keDaftarKontrak(muatan: unknown): ContractRow[] {
  const isi = buka<unknown[]>(muatan)
  return Array.isArray(isi) ? isi.map(keKontrak) : []
}

function keAngka(nilai: unknown): number {
  const angka = Number(nilai ?? 0)
  return Number.isFinite(angka) ? angka : 0
}

/* Selisih bulan kalender, bukan selisih hari: masa sewa ditulis "6 bulan" dan
   tanggal akhir bergeser mengikuti panjang bulan. Tanggal tak terbaca
   menghasilkan 0 — ditampilkan "0 bulan", tanda datanya yang cacat — supaya
   `monthly` memakai nilai kontrak apa adanya, bukan hasil bagi karangan. */
function hitungBulan(mulai: string, akhir: string): number {
  const a = new Date(mulai)
  const b = new Date(akhir)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  return Math.max(1, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()))
}
