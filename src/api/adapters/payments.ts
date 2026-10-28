import { buka } from '@/api/client'
import type { PaymentRow, PaymentStatusDto } from '@/api/types'

/* Dua tabel, satu per arah. `Belum Bayar` hanya ada di tampilan: backend tidak
   menyimpan status itu — bulan yang belum dibayar tidak punya baris pembayaran —
   jadi kalau label itu sampai terkirim, satu-satunya status "menunggu" yang sah
   adalah `pending`. */
const STATUS: Record<string, PaymentRow['status']> = {
  pending: 'Menunggu Verifikasi',
  paid: 'Lunas',
  rejected: 'Ditolak',
}

const DARI_STATUS: Record<PaymentRow['status'], PaymentStatusDto> = {
  'Menunggu Verifikasi': 'pending',
  'Belum Bayar': 'pending',
  Lunas: 'paid',
  Ditolak: 'rejected',
}

export function keStatusBayar(nilai: string): PaymentRow['status'] {
  return STATUS[nilai] ?? 'Menunggu Verifikasi'
}

export function dariStatusBayar(nilai: PaymentRow['status']): PaymentStatusDto {
  return DARI_STATUS[nilai] ?? 'pending'
}

export function kePembayaran(dto: unknown): PaymentRow {
  const p = (dto ?? {}) as Record<string, unknown>
  const contract = (p.contract ?? {}) as Record<string, unknown>
  const tenant = (contract.tenant ?? {}) as Record<string, unknown>
  const unit = (contract.unit ?? {}) as Record<string, unknown>
  const jumlah = Number(p.amount ?? 0)
  return {
    id: Number(p.id),
    contract_id: Number(p.contract_id),
    /* `month` diteruskan apa adanya: ERD memakai `YYYY-MM`, dan label bulan
       adalah urusan tampilan. */
    month: String(p.month ?? ''),
    amount: Number.isFinite(jumlah) ? jumlah : 0,
    status: keStatusBayar(String(p.status)),
    proof_url: String(p.proof_url ?? ''),
    renter_name: String(p.renter_name ?? tenant.name ?? ''),
    unit_title: String(p.unit_title ?? unit.name ?? ''),
  }
}

export function keDaftarPembayaran(muatan: unknown): PaymentRow[] {
  const isi = buka<unknown[]>(muatan)
  return Array.isArray(isi) ? isi.map(kePembayaran) : []
}
