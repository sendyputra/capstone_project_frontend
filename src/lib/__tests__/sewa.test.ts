import { describe, expect, it } from 'vitest'
import { hitungSewa } from '@/lib/sewa'

describe('hitungSewa', () => {
  it('menambah bulan dan mengalikan harga', () => {
    expect(hitungSewa('2026-11-01', 3, 1_500_000)).toEqual({ akhir: '2027-02-01', total: 4_500_000 })
  })

  it('menjepit akhir bulan bila tanggal tidak ada di bulan tujuan', () => {
    expect(hitungSewa('2026-01-31', 1, 1_000_000).akhir).toBe('2026-02-28')
  })
})
