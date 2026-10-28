import { buka } from '@/api/client'
import type { ContractRow, ContractStatusDto, KtpStatus } from '@/api/types'
import { hitungBulanSewa } from '@/lib/sewa'
import { tanggalKalender } from '@/lib/tanggal'

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

/* Status verifikasi KTP penyewa memakai tiga label tampilan. Backend asli
   menyimpan enum Inggris (`verified`/`pending`/`unverified`); keduanya
   diterima, nilai lain diabaikan sehingga kolom "KTP" jatuh ke "Belum". */
const STATUS_KTP: Record<string, KtpStatus> = {
  verified: 'Terverifikasi',
  pending: 'Menunggu',
  unverified: 'Belum',
  Terverifikasi: 'Terverifikasi',
  Menunggu: 'Menunggu',
  Belum: 'Belum',
}

function keKtp(nilai: unknown): KtpStatus | undefined {
  return STATUS_KTP[String(nilai ?? '')]
}

/* Dua ejaan bidang diterima (`ktp` dari DTO lama, `ktp_status` dari backend),
   dan baris bersarang didahulukan atas baris datar. */
function bacaKtp(...baris: Record<string, unknown>[]): KtpStatus | undefined {
  for (const sumber of baris) {
    const ktp = keKtp(sumber.ktp ?? sumber.ktp_status)
    if (ktp) return ktp
  }
  return undefined
}

export function keKontrak(dto: unknown): ContractRow {
  const k = (dto ?? {}) as Record<string, unknown>
  const tenant = (k.tenant ?? {}) as Record<string, unknown>
  const unit = (k.unit ?? {}) as Record<string, unknown>
  const owner = (unit.owner ?? {}) as Record<string, unknown>
  const total = keAngka(k.total_price)
  const mulai = tanggalKalender(String(k.start_date ?? ''))
  const akhir = tanggalKalender(String(k.end_date ?? ''))
  const bulan = hitungBulan(mulai, akhir)
  const ktp = bacaKtp(tenant, k)
  return {
    id: Number(k.id),
    unit_id: Number(k.unit_id),
    tenant_id: Number(k.tenant_id ?? 0),
    start_date: mulai,
    end_date: akhir,
    total_price: total,
    status: keStatusKontrak(String(k.status)),
    renter_name: String(k.renter_name ?? tenant.name ?? ''),
    unit_title: String(k.unit_title ?? unit.name ?? ''),
    owner_name: String(k.owner_name ?? owner.name ?? ''),
    term: `${bulan} bulan`,
    /* Biaya bulanan dihitung dari nilai kontrak dan masa sewa, bukan dibaca dari
       `monthly` kiriman server: dua sumber untuk satu angka bisa berselisih. */
    monthly: bulan > 0 ? Math.round(total / bulan) : total,
    /* Hanya diteruskan bila server mengirimnya; tanpanya kolom "KTP" di layar
       pemilik tampil "Belum". */
    ...(ktp ? { ktp } : {}),
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
