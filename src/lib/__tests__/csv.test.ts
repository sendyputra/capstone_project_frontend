import { describe, expect, it } from 'vitest'
import { susunCsv } from '@/lib/csv'

describe('susunCsv', () => {
  it('menulis BOM, header, dan baris dengan pemisah titik koma', () => {
    expect(susunCsv(['Nama', 'Jumlah'], [['Budi', 2]])).toBe('\uFEFFNama;Jumlah\r\nBudi;2')
  })

  it('mengosongkan nilai kosong', () => {
    expect(susunCsv(['A', 'B'], [[null, undefined]])).toBe('\uFEFFA;B\r\n;')
  })

  it('mengapit sel yang memuat pemisah, kutip, atau baris baru', () => {
    expect(susunCsv(['A'], [['Siti; Sarah'], ['kata "kutip"'], ['dua\nbaris']])).toBe(
      '\uFEFFA\r\n"Siti; Sarah"\r\n"kata ""kutip"""\r\n"dua\nbaris"',
    )
  })

  it('memberi awalan kutip pada sel yang bisa jadi formula', () => {
    expect(susunCsv(['A'], [['=1+1'], ['-1'], ['@SUM(A1)']])).toBe("\uFEFFA\r\n'=1+1\r\n'-1\r\n'@SUM(A1)")
  })
})
