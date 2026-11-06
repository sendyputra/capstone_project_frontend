import { describe, expect, it } from 'vitest'
import { hitungBulanSewa, hitungSewa, labelStatusKontrak, tanggalBentrok } from '@/lib/sewa'

describe('hitungSewa', () => {
  it('menambah bulan dan mengalikan harga', () => {
    expect(hitungSewa('2026-11-01', 3, 1_500_000)).toEqual({ akhir: '2027-02-01', total: 4_500_000 })
  })

  it('menjepit akhir bulan bila tanggal tidak ada di bulan tujuan', () => {
    expect(hitungSewa('2026-01-31', 1, 1_000_000).akhir).toBe('2026-02-28')
  })
})

/* Rentang sewa setengah terbuka `[mulai, akhir)`; dipakai halaman detail unit
   untuk menolak pengajuan sebelum server menjawab 422. */
describe('tanggalBentrok', () => {
  it('mengembalikan tanggal terisi pertama di tengah rentang', () => {
    expect(tanggalBentrok('2026-10-29', '2026-11-29', ['2026-11-05', '2026-11-08'])).toBe('2026-11-05')
  })

  it('tidak menghitung tanggal akhir sebagai bentrok', () => {
    expect(tanggalBentrok('2026-11-01', '2026-11-08', ['2026-11-08'])).toBeUndefined()
  })

  it('menganggap rentang tanpa tanggal terisi sebagai bebas', () => {
    expect(tanggalBentrok('2026-11-01', '2026-12-01', [])).toBeUndefined()
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

/* ADR 0002: `cancelled` memuat dua peristiwa. Yang tidak pernah punya tanggal
   berhenti adalah pengajuan yang ditolak, dan layar harus menyebutnya begitu. */
describe('labelStatusKontrak', () => {
  it('menyebut pengajuan yang ditolak sebagai Ditolak', () => {
    expect(labelStatusKontrak({ status: 'Dibatalkan' })).toBe('Ditolak')
    expect(labelStatusKontrak({ status: 'Dibatalkan', ended_at: '2026-10-15' })).toBe('Dibatalkan')
  })

  it('meneruskan status lain apa adanya', () => {
    expect(labelStatusKontrak({ status: 'Aktif' })).toBe('Aktif')
    expect(labelStatusKontrak({ status: 'Selesai', ended_at: '2026-10-15' })).toBe('Selesai')
  })
})
