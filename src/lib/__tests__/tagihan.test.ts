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

  it('berhenti setelah masa sewa habis walau hari ini lebih jauh', () => {
    const hasil = susunTagihan([kontrak], [], '2027-06-01')
    expect(hasil.map((t) => t.month)).toEqual(['2026-11', '2026-12', '2027-01'])
  })

  /* Kontrak 15 Nov 2026 – 14 Feb 2027 bernilai tiga bulan sewa (4.500.000), dan
     `monthly` 1.500.000 berasal dari aturan yang sama. Menagih tiap bulan
     kalender yang tersentuh akan menghasilkan empat baris dan 6.000.000 —
     menagih lebih dari nilai kontrak. */
  it('menagih sebanyak masa sewa, bukan tiap bulan kalender yang tersentuh', () => {
    const hasil = susunTagihan([kontrak], [], '2027-06-01')
    expect(hasil).toHaveLength(3)
    expect(hasil.reduce((jumlah, t) => jumlah + t.amount, 0)).toBe(kontrak.total_price)
  })

  it('mengabaikan kontrak yang belum aktif', () => {
    expect(susunTagihan([{ ...kontrak, status: 'Menunggu' }], [], '2027-01-10')).toEqual([])
  })

  /* Pembayaran bertambah, tidak ditimpa: unggahan ulang setelah ditolak
     meninggalkan baris lama. Yang mewakili keadaan sekarang adalah `id`
     terbesar — urutan kedatangan larik tidak boleh menentukan hasilnya. */
  it('memakai baris pembayaran terbaru saat satu bulan punya beberapa baris', () => {
    const ditolak: PaymentRow = { ...bayar, id: 10, month: '2026-12', status: 'Ditolak', proof_url: '/bukti/lama.jpg' }
    const menunggu: PaymentRow = { ...bayar, id: 11, month: '2026-12', status: 'Menunggu Verifikasi', proof_url: '/bukti/baru.jpg' }

    for (const larik of [[ditolak, menunggu], [menunggu, ditolak]]) {
      const desember = susunTagihan([kontrak], larik, '2027-01-10').find((t) => t.month === '2026-12')
      expect(desember).toMatchObject({ status: 'Menunggu Verifikasi', proof_url: '/bukti/baru.jpg' })
    }
  })

  it('baris Lunas yang lebih baru tidak tertutup baris lama', () => {
    const menunggu: PaymentRow = { ...bayar, id: 10, month: '2026-12', status: 'Menunggu Verifikasi' }
    const lunas: PaymentRow = { ...bayar, id: 12, month: '2026-12', status: 'Lunas' }
    const desember = susunTagihan([kontrak], [menunggu, lunas], '2027-01-10').find((t) => t.month === '2026-12')
    expect(desember?.status).toBe('Lunas')
  })

  /* Adaptor kontrak sengaja mengirim `start_date: ''` untuk tanggal tak terbaca.
     Kontrak seperti itu tidak bisa ditagih, tetapi juga tidak boleh menggagalkan
     seluruh daftar tagihan penyewa lain. */
  it('melewati kontrak dengan tanggal mulai tak terbaca, tanpa melempar', () => {
    expect(susunTagihan([{ ...kontrak, start_date: '' }], [], '2027-01-10')).toEqual([])
    expect(susunTagihan([{ ...kontrak, start_date: 'bukan-tanggal' }], [], '2027-01-10')).toEqual([])
    expect(susunTagihan([{ ...kontrak, start_date: '2026-13-01' }], [], '2027-01-10')).toEqual([])
  })
})
