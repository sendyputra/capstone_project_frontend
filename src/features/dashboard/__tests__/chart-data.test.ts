import { describe, expect, it } from 'vitest'
import { hitungPendapatanBulanan, labelBulanSingkat } from '@/features/dashboard/lib/chart-data'
import type { PaymentRow } from '@/api/types'

function bayar(over: Partial<PaymentRow>): PaymentRow {
  return { id: 1, contract_id: 1, month: '2026-10', amount: 100, status: 'Lunas', proof_url: '', renter_name: 'A', unit_title: 'B', ...over }
}

describe('hitungPendapatanBulanan', () => {
  it('mengisi bulan tanpa pembayaran lunas dengan nol, urut naik', () => {
    const hasil = hitungPendapatanBulanan([bayar({ month: '2026-09', amount: 500 })], '2026-10')
    expect(hasil).toEqual([
      { bulan: '2026-05', jumlah: 0 },
      { bulan: '2026-06', jumlah: 0 },
      { bulan: '2026-07', jumlah: 0 },
      { bulan: '2026-08', jumlah: 0 },
      { bulan: '2026-09', jumlah: 500 },
      { bulan: '2026-10', jumlah: 0 },
    ])
  })

  it('menjumlahkan beberapa kontrak pada bulan yang sama', () => {
    const hasil = hitungPendapatanBulanan(
      [bayar({ id: 1, contract_id: 1, month: '2026-10', amount: 300 }), bayar({ id: 2, contract_id: 2, month: '2026-10', amount: 200 })],
      '2026-10',
    )
    expect(hasil.at(-1)).toEqual({ bulan: '2026-10', jumlah: 500 })
  })

  it('hanya menghitung baris lunas', () => {
    const hasil = hitungPendapatanBulanan(
      [
        bayar({ id: 1, month: '2026-10', amount: 300 }),
        bayar({ id: 2, month: '2026-09', amount: 300, status: 'Menunggu Verifikasi' }),
        bayar({ id: 3, month: '2026-08', amount: 300, status: 'Ditolak' }),
      ],
      '2026-10',
    )
    expect(hasil.map((titik) => titik.jumlah)).toEqual([0, 0, 0, 0, 0, 300])
  })

  it('hanya memakai baris terbaru saat satu kontrak-bulan punya beberapa baris', () => {
    const hasil = hitungPendapatanBulanan(
      [
        bayar({ id: 2, contract_id: 9, month: '2026-10', amount: 100 }),
        bayar({ id: 7, contract_id: 9, month: '2026-10', amount: 150 }),
      ],
      '2026-10',
    )
    expect(hasil.at(-1)?.jumlah).toBe(150)
  })

  it('baris lunas lama tidak hidup lagi setelah unggahan baru ditolak', () => {
    const hasil = hitungPendapatanBulanan(
      [
        bayar({ id: 2, contract_id: 5, month: '2026-10', amount: 400 }),
        bayar({ id: 9, contract_id: 5, month: '2026-10', amount: 400, status: 'Ditolak' }),
      ],
      '2026-10',
    )
    expect(hasil.at(-1)?.jumlah).toBe(0)
  })

  it('mengabaikan bulan cacat dan pembayaran di luar jendela', () => {
    const hasil = hitungPendapatanBulanan(
      [bayar({ month: '', amount: 900 }), bayar({ month: '2026-13', amount: 900 }), bayar({ month: '2025-10', amount: 900 }), bayar({ month: '2026-10', amount: 100 })],
      '2026-10',
    )
    expect(hasil.map((titik) => titik.jumlah)).toEqual([0, 0, 0, 0, 0, 100])
  })

  it('menyeberang tahun tanpa menggeser bulan', () => {
    expect(hitungPendapatanBulanan([], '2026-02').map((titik) => titik.bulan)).toEqual([
      '2025-09',
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ])
  })
})

describe('labelBulanSingkat', () => {
  it('memendekkan bulan Indonesia dan meneruskan nilai cacat', () => {
    expect(labelBulanSingkat('2026-06')).toBe('Jun')
    expect(labelBulanSingkat('2026-12')).toBe('Des')
    expect(labelBulanSingkat('-')).toBe('-')
  })
})
