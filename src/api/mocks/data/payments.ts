import type { Payment } from '@/api/types'

/* `month` memakai format `YYYY-MM` seperti ERD; `proof_url` menyimpan nama
   berkas bukti, sebagaimana purwarupa menampilkan `proofName`. */
export const payments: Payment[] = [
  { id: 301, contract_id: 201, month: '2026-10', amount: 2500000, status: 'Belum Bayar', proof_url: '' },
  { id: 302, contract_id: 202, month: '2026-10', amount: 3100000, status: 'Menunggu Verifikasi', proof_url: 'bukti-transfer-okt.jpg' },
  { id: 303, contract_id: 201, month: '2026-09', amount: 2500000, status: 'Lunas', proof_url: 'bukti-transfer-sep.jpg' },
  { id: 304, contract_id: 202, month: '2026-09', amount: 3100000, status: 'Ditolak', proof_url: '' },
]
