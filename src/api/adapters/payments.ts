import { buka } from '@/api/client'
import type { PaymentRow } from '@/api/types'

/* Seperti adaptor kontrak: enum backend (`paid`) dan enum tampilan lama
   (`Lunas`) sama-sama diterima selama transisi, karena mock masih menyimpan
   nilai Indonesia sampai Task 9 menulis ulang data contohnya. `Belum Bayar`
   hanya datang dari nilai lama — backend memakai `pending` untuk arti yang sama
   dengan `Menunggu Verifikasi`. */
const STATUS: Record<string, PaymentRow['status']> = {
  pending: 'Menunggu Verifikasi',
  paid: 'Lunas',
  rejected: 'Ditolak',
  'Belum Bayar': 'Belum Bayar',
  'Menunggu Verifikasi': 'Menunggu Verifikasi',
  Lunas: 'Lunas',
  Ditolak: 'Ditolak',
}

export function keStatusBayar(nilai: string): PaymentRow['status'] {
  return STATUS[nilai] ?? 'Menunggu Verifikasi'
}

export function kePembayaran(dto: unknown): PaymentRow {
  const p = (dto ?? {}) as Record<string, unknown>
  const jumlah = Number(p.amount ?? 0)
  return {
    id: Number(p.id),
    contract_id: Number(p.contract_id),
    /* `month` dibiarkan apa adanya: ERD memakai `YYYY-MM`, sedangkan handler
       mock masih mengirim label bulan. Task 9 yang menyeragamkannya. */
    month: String(p.month ?? ''),
    amount: Number.isFinite(jumlah) ? jumlah : 0,
    status: keStatusBayar(String(p.status)),
    proof_url: String(p.proof_url ?? ''),
    renter_name: String(p.renter_name ?? ''),
    unit_title: String(p.unit_title ?? ''),
  }
}

export function keDaftarPembayaran(muatan: unknown): PaymentRow[] {
  const isi = buka<unknown[]>(muatan)
  return Array.isArray(isi) ? isi.map(kePembayaran) : []
}
