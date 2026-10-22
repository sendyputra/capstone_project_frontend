import type { Payment, PaymentStatusDto } from '@/api/types'

/* Baris tabel `payments` seperti yang dikirim API asli: bentuknya sama dengan
   `Payment`, hanya statusnya enum backend (`paid`), bukan label tampilan. */
export type PaymentDto = Omit<Payment, 'status'> & { status: PaymentStatusDto }

/* `month` memakai format `YYYY-MM` seperti ERD; `proof_url` menyimpan nama
   berkas bukti, sebagaimana purwarupa menampilkan `proofName`.

   Bulan yang belum dibayar tidak punya baris di sini: backend tidak menyimpan
   status "belum bayar", jadi ketiadaan baris itulah tandanya. */
export const payments: PaymentDto[] = [
  { id: 302, contract_id: 202, month: '2026-10', amount: 3100000, status: 'pending', proof_url: 'bukti-transfer-okt.jpg' },
  { id: 303, contract_id: 201, month: '2026-09', amount: 2500000, status: 'paid', proof_url: 'bukti-transfer-sep.jpg' },
  { id: 304, contract_id: 202, month: '2026-09', amount: 3100000, status: 'rejected', proof_url: '' },
  { id: 305, contract_id: 205, month: '2026-11', amount: 2500000, status: 'pending', proof_url: 'bukti-transfer-nov.jpg' },
]
