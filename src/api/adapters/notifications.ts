import type { NotificationRow } from '@/api/types'

export function keNotifikasi(dto: unknown): NotificationRow {
  const n = (dto ?? {}) as Record<string, unknown>
  return {
    id: String(n.id ?? ''),
    type: String(n.type ?? ''),
    message: String(n.message ?? ''),
    month: String(n.month ?? ''),
    amount: Number(n.amount ?? 0),
    contract_id: Number(n.contract_id ?? 0),
    read_at: n.read_at === null || n.read_at === undefined ? null : String(n.read_at),
    created_at: String(n.created_at ?? ''),
  }
}

/* Backend mengirim daftar dan jumlah belum dibaca dalam satu jawaban; jumlahnya
   dipakai badge, jadi dihitung di sini sekali agar tidak menyimpang dari baris. */
export function keDaftarNotifikasi(muatan: unknown): { rows: NotificationRow[]; unread: number } {
  const isi = (muatan ?? {}) as { data?: unknown; unread?: unknown }
  const rows = Array.isArray(isi.data) ? isi.data.map(keNotifikasi) : []
  return {
    rows,
    unread: isi.unread === undefined ? rows.filter((baris) => baris.read_at === null).length : Number(isi.unread),
  }
}
