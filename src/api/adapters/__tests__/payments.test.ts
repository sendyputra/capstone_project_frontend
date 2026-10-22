import { describe, expect, it } from 'vitest'
import { keDaftarPembayaran, kePembayaran, keStatusBayar } from '@/api/adapters/payments'

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

  /* Mock masih menyimpan enum tampilan lama; kalau tidak diteruskan, tagihan
     yang baru disetujui kembali tampak menunggu verifikasi. */
  it('meneruskan enum Indonesia yang masih dikirim selama transisi', () => {
    expect(keStatusBayar('Belum Bayar')).toBe('Belum Bayar')
    expect(keStatusBayar('Menunggu Verifikasi')).toBe('Menunggu Verifikasi')
    expect(keStatusBayar('Lunas')).toBe('Lunas')
    expect(keStatusBayar('Ditolak')).toBe('Ditolak')
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
    expect(kePembayaran({ ...dto, status: 'Lunas' }).status).toBe('Lunas')
  })
})
