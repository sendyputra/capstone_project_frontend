import { buka } from '@/api/client'
import type { ContractRow, ContractStatusDto } from '@/api/types'
import { hitungBulanSewa } from '@/lib/sewa'

/* Dua tabel, satu per arah: enum backend ke label tampilan, dan sebaliknya.
   Nilai di luar enum backend jatuh ke `Menunggu`, bukan diteruskan mentah —
   kontrak asing tak boleh menyamar jadi status sah. */
const STATUS: Record<string, ContractRow['status']> = {
  pending: 'Menunggu',
  active: 'Aktif',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

const DARI_STATUS: Record<ContractRow['status'], ContractStatusDto> = {
  Menunggu: 'pending',
  Aktif: 'active',
  Selesai: 'completed',
  Dibatalkan: 'cancelled',
}

export function keStatusKontrak(nilai: string): ContractRow['status'] {
  return STATUS[nilai] ?? 'Menunggu'
}

export function dariStatusKontrak(nilai: ContractRow['status']): ContractStatusDto {
  return DARI_STATUS[nilai] ?? 'pending'
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

/* Selisih bulan dibulatkan ke atas, bukan dipotong: kontrak 1 Sep 2026 –
   28 Feb 2027 adalah enam bulan sewa (lima bulan penuh ditambah sisa hari di
   bulan keenam), dan `total_price` data contoh memang enam kali harga bulanan
   unit. Memotong sisa hari membuat "5 bulan" dan biaya bulanan yang tidak
   pernah cocok dengan nilai kontrak. Tanggal tak terbaca menghasilkan 0 —
   ditampilkan "0 bulan", tanda datanya yang cacat — supaya `monthly` memakai
   nilai kontrak apa adanya, bukan hasil bagi karangan.

   Aturannya tinggal di `@/lib/sewa` karena `susunTagihan` harus memakai aturan
   yang sama untuk menentukan jumlah baris tagihan; dua salinan aturan ini bisa
   berselisih dan membuat jumlah tagihan tidak sama dengan `total_price`. */
function hitungBulan(mulai: string, akhir: string): number {
  return hitungBulanSewa(mulai, akhir)
}
