import { describe, expect, it } from 'vitest'
import { dariStatusBayar, keDaftarPembayaran, kePembayaran, keStatusBayar } from '@/api/adapters/payments'

const dto = {
  id: 1, contract_id: 2, month: '2026-10', amount: '1500000',
  status: 'paid', proof_url: 'x', renter_name: 'Siti', unit_title: 'Kos A',
}

describe('adaptor pembayaran', () => {
  it('memetakan tiga status backend', () => {
    expect(keStatusBayar('pending')).toBe('Menunggu Verifikasi')
    expect(keStatusBayar('paid')).toBe('Lunas')
    expect(keStatusBayar('rejected')).toBe('Ditolak')
  })

  it('memberi Menunggu Verifikasi untuk status tak dikenal', () => {
    expect(keStatusBayar('baru')).toBe('Menunggu Verifikasi')
  })

  /* Mock kini menyimpan enum backend; label Indonesia yang tersisa jatuh ke
     `Menunggu Verifikasi` seperti status asing lainnya. */
  it('tidak meneruskan label Indonesia sebagai status', () => {
    expect(keStatusBayar('Lunas')).toBe('Menunggu Verifikasi')
    expect(keStatusBayar('Ditolak')).toBe('Menunggu Verifikasi')
  })

  /* `Belum Bayar` tidak punya padanan di backend: bulan yang belum dibayar tidak
     punya baris pembayaran sama sekali. Kalau label itu sampai terkirim, satu-
     satunya status "menunggu" yang sah adalah `pending`. */
  it('mengirim enum backend untuk tiap status tampilan', () => {
    expect(dariStatusBayar('Menunggu Verifikasi')).toBe('pending')
    expect(dariStatusBayar('Lunas')).toBe('paid')
    expect(dariStatusBayar('Ditolak')).toBe('rejected')
    expect(dariStatusBayar('Belum Bayar')).toBe('pending')
  })

  it('membaca bulan YYYY-MM apa adanya', () => {
    expect(kePembayaran({ id: 1, contract_id: 2, month: '2026-10', amount: '1500000', status: 'paid', proof_url: 'x' }).month).toBe('2026-10')
  })

  it('menerima amplop data', () => {
    expect(keDaftarPembayaran({ data: [] })).toEqual([])
  })

  it('menerima daftar langsung dan membaca angka', () => {
    expect(keDaftarPembayaran([dto])).toHaveLength(1)
    expect(kePembayaran(dto)).toMatchObject({ amount: 1_500_000, status: 'Lunas', renter_name: 'Siti' })
    expect(keDaftarPembayaran('bukan-daftar')).toEqual([])
  })

  it('memberi nilai aman saat bidang hilang atau bertipe salah', () => {
    expect(kePembayaran({})).toMatchObject({
      month: '',
      amount: 0,
      status: 'Menunggu Verifikasi',
      proof_url: '',
      renter_name: '',
      unit_title: '',
    })
    expect(kePembayaran({ ...dto, amount: 'bukan-angka' }).amount).toBe(0)
    expect(kePembayaran({ ...dto, status: 'Lunas' }).status).toBe('Menunggu Verifikasi')
  })
})
