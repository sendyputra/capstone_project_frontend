import { describe, expect, it } from 'vitest'
import type { ContractRow, PaymentRow } from '@/api/types'
import { susunTagihan } from '@/lib/tagihan'

const kontrak: ContractRow = {
  id: 1, unit_id: 2, tenant_id: 3, start_date: '2026-11-15', end_date: '2027-02-14',
  total_price: 4_500_000, status: 'Aktif', renter_name: 'Siti', unit_title: 'Kos A',
  owner_name: 'Pak Wahyu', term: '3 bulan', monthly: 1_500_000,
}

const bayar: PaymentRow = {
  id: 9, contract_id: 1, month: '2026-12', amount: 1_500_000, status: 'Lunas',
  proof_url: 'x', renter_name: 'Siti', unit_title: 'Kos A',
}

describe('susunTagihan', () => {
  it('menurunkan bulan dari kontrak dan menandai yang belum dibayar', () => {
    const hasil = susunTagihan([kontrak], [bayar], '2027-01-10')
    expect(hasil.map((t) => t.month)).toEqual(['2026-11', '2026-12', '2027-01'])
    expect(hasil[0].status).toBe('Belum Bayar')
    expect(hasil[1].status).toBe('Lunas')
  })

  it('berhenti di end_date walau hari ini lebih jauh', () => {
    const hasil = susunTagihan([kontrak], [], '2027-06-01')
    expect(hasil.map((t) => t.month)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02'])
  })

  it('mengabaikan kontrak yang belum aktif', () => {
    expect(susunTagihan([{ ...kontrak, status: 'Menunggu' }], [], '2027-01-10')).toEqual([])
  })
})
