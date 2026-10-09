import { describe, expect, it } from 'vitest'
import { formatRupiah, parseAmount } from '@/lib/format'

describe('parseAmount', () => {
  it('menerima angka utuh', () => {
    expect(parseAmount(1200000)).toBe(1200000)
  })

  it('menerima string desimal dari kolom decimal(15,2)', () => {
    expect(parseAmount('1200000.00')).toBe(1200000)
  })

  it('mengembalikan 0 untuk nilai yang tidak masuk akal', () => {
    expect(parseAmount('')).toBe(0)
    expect(parseAmount(null)).toBe(0)
  })
})

describe('formatRupiah', () => {
  it('memformat tanpa desimal', () => {
    expect(formatRupiah(1200000)).toBe('Rp 1.200.000')
  })

  it('memformat string desimal dari backend', () => {
    expect(formatRupiah('1200000.00')).toBe('Rp 1.200.000')
  })
})
