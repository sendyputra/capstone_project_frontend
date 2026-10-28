import { buka } from '@/api/client'
import type { KtpStatus, TenantRow } from '@/api/types'

/* Backend mengirim enum Inggris; data contoh lama memakai label tampilan.
   Keduanya diterima, nilai asing jatuh ke `Belum` — sama seperti kolom KTP
   pada pengguna dan kontrak. */
const KTP: Record<string, KtpStatus> = {
  unverified: 'Belum',
  pending: 'Menunggu',
  verified: 'Terverifikasi',
  Belum: 'Belum',
  Menunggu: 'Menunggu',
  Terverifikasi: 'Terverifikasi',
}

function keKtp(nilai: unknown): KtpStatus {
  return KTP[String(nilai ?? '')] ?? 'Belum'
}

/* `created_at` ISO dipotong ke tanggal; `joined` yang sudah berformat
   diteruskan apa adanya. */
function keJoined(nilai: unknown): string {
  const teks = String(nilai ?? '')
  return /^\d{4}-\d{2}-\d{2}/.test(teks) ? teks.slice(0, 10) : teks
}

function keAngkaOpsional(nilai: unknown): number | null {
  return nilai === null || nilai === undefined ? null : Number(nilai)
}

export function keTenant(dto: unknown): TenantRow {
  const t = (dto ?? {}) as Record<string, unknown>
  return {
    id: Number(t.id),
    user_id: keAngkaOpsional(t.user_id),
    owner_id: keAngkaOpsional(t.owner_id),
    name: String(t.name ?? ''),
    phone: String(t.phone ?? ''),
    ktp: keKtp(t.ktp_status ?? t.ktp),
    contracts_count: Number(t.contracts_count ?? 0),
    joined: keJoined(t.created_at ?? t.joined),
  }
}

export function keDaftarTenant(muatan: unknown): TenantRow[] {
  const isi = buka<unknown[]>(muatan)
  return Array.isArray(isi) ? isi.map(keTenant) : []
}

/* Formulir memakai label tampilan; API menuntut enum backend. */
export function dariKtp(nilai: KtpStatus): 'unverified' | 'pending' | 'verified' {
  if (nilai === 'Terverifikasi') return 'verified'
  if (nilai === 'Menunggu') return 'pending'
  return 'unverified'
}
