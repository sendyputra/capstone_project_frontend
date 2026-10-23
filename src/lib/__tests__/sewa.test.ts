import { describe, expect, it } from 'vitest'
import { hitungBulanSewa, hitungSewa } from '@/lib/sewa'

describe('hitungSewa', () => {
  it('menambah bulan dan mengalikan harga', () => {
    expect(hitungSewa('2026-11-01', 3, 1_500_000)).toEqual({ akhir: '2027-02-01', total: 4_500_000 })
  })

  it('menjepit akhir bulan bila tanggal tidak ada di bulan tujuan', () => {
    expect(hitungSewa('2026-01-31', 1, 1_000_000).akhir).toBe('2026-02-28')
  })
})

/* Aturan yang dipakai adaptor kontrak (biaya bulanan) dan `susunTagihan`
   (jumlah baris tagihan): sisa hari dibulatkan ke atas hanya bila tanggal akhir
   melewati tanggal mulai. */
describe('hitungBulanSewa', () => {
  it('menghitung bulan penuh tanpa sisa hari sebagai bulan utuh', () => {
    expect(hitungBulanSewa('2026-11-15', '2027-02-14')).toBe(3)
  })

  it('membulatkan sisa hari menjadi bulan penuh', () => {
    expect(hitungBulanSewa('2026-09-01', '2027-02-28')).toBe(6)
    expect(hitungBulanSewa('2026-11-01', '2027-02-01')).toBe(3)
  })

  it('memberi nol untuk tanggal tak terbaca', () => {
    expect(hitungBulanSewa('', '')).toBe(0)
    expect(hitungBulanSewa('2026-11-15', 'bukan-tanggal')).toBe(0)
  })
})
