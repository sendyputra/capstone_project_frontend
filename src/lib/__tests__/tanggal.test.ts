import { describe, expect, it } from 'vitest'
import { tanggalHariIni } from '@/lib/tanggal'

describe('tanggalHariIni', () => {
  /* Awal bulan WIB = 17.00 UTC hari sebelumnya. `toISOString()` (UTC) masih
     menunjuk bulan lalu di sini, sehingga tagihan bulan berjalan hilang selama
     tujuh jam pertama tiap bulan. */
  it('memakai tanggal kalender WIB, bukan UTC', () => {
    expect(tanggalHariIni(new Date('2026-10-31T17:30:00Z'))).toBe('2026-11-01')
  })

  it('tetap di bulan berjalan sepanjang dini hari WIB', () => {
    expect(tanggalHariIni(new Date('2026-10-31T16:59:00Z'))).toBe('2026-10-31')
    expect(tanggalHariIni(new Date('2026-11-01T00:30:00Z'))).toBe('2026-11-01')
    expect(tanggalHariIni(new Date('2026-11-30T16:00:00Z'))).toBe('2026-11-30')
  })
})
