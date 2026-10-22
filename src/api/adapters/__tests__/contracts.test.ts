import { describe, expect, it } from 'vitest'
import { dariStatusKontrak, keDaftarKontrak, keKontrak, keStatusKontrak } from '@/api/adapters/contracts'

/* DTO backend: relasi sudah di-join handler, angka bisa datang sebagai teks. */
const dto = {
  id: 1, unit_id: 2, tenant_id: 3, start_date: '2026-11-01', end_date: '2027-02-01',
  total_price: '4500000', status: 'active', renter_name: 'Siti', unit_title: 'Kos A', owner_name: 'Pak Wahyu',
}

describe('adaptor kontrak', () => {
  it('memetakan keempat status', () => {
    expect(keStatusKontrak('pending')).toBe('Menunggu')
    expect(keStatusKontrak('active')).toBe('Aktif')
    expect(keStatusKontrak('completed')).toBe('Selesai')
    expect(keStatusKontrak('cancelled')).toBe('Dibatalkan')
  })

  it('memberi Menunggu untuk status tak dikenal', () => {
    expect(keStatusKontrak('baru')).toBe('Menunggu')
  })

  /* Mock kini menyimpan enum backend, jadi label Indonesia tidak lagi
     diteruskan: nilai asing jatuh ke `Menunggu`, bukan diteruskan mentah. */
  it('tidak meneruskan label Indonesia sebagai status', () => {
    expect(keStatusKontrak('Aktif')).toBe('Menunggu')
    expect(keStatusKontrak('Selesai')).toBe('Menunggu')
  })

  it('mengirim enum backend untuk tiap status tampilan', () => {
    expect(dariStatusKontrak('Menunggu')).toBe('pending')
    expect(dariStatusKontrak('Aktif')).toBe('active')
    expect(dariStatusKontrak('Selesai')).toBe('completed')
    expect(dariStatusKontrak('Dibatalkan')).toBe('cancelled')
  })

  it('membaca relasi dan angka', () => {
    const baris = keKontrak({
      id: 1, unit_id: 2, tenant_id: 3, start_date: '2026-11-01', end_date: '2027-02-01',
      total_price: '4500000', status: 'active', renter_name: 'Siti', unit_title: 'Kos A', owner_name: 'Pak Wahyu',
    })
    expect(baris).toMatchObject({ status: 'Aktif', total_price: 4_500_000, renter_name: 'Siti' })
  })

  it('menerima daftar langsung', () => {
    expect(keDaftarKontrak([])).toEqual([])
  })

  it('menerima daftar beramplop', () => {
    expect(keDaftarKontrak({ data: [dto] })).toHaveLength(1)
    expect(keDaftarKontrak('bukan-daftar')).toEqual([])
  })

  it('menghitung masa sewa dan biaya bulanan dari nilai kontrak', () => {
    expect(keKontrak(dto)).toMatchObject({ term: '3 bulan', monthly: 1_500_000 })
    /* Tanggal tak terbaca: nol bulan, biaya bulanan memakai nilai kontrak. */
    expect(keKontrak({ ...dto, start_date: '', end_date: '' })).toMatchObject({ term: '0 bulan', monthly: 4_500_000 })
  })

  it('memberi nilai aman saat bidang hilang atau bertipe salah', () => {
    expect(keKontrak({})).toMatchObject({
      start_date: '',
      end_date: '',
      total_price: 0,
      status: 'Menunggu',
      renter_name: '',
      unit_title: '',
      owner_name: '',
    })
    expect(keKontrak({ ...dto, total_price: 'bukan-angka' }).total_price).toBe(0)
  })
})
