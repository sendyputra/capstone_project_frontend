import { describe, expect, it } from 'vitest'
import { keDaftarUnit, keUnit } from '@/api/adapters/units'

/* Bentuk DTO backend: enum dan harga datang sebagai teks, `booked_dates` bisa
   berisi tanggal ISO. Adaptor yang menormalkannya sekali, bukan tiap komponen. */
const dto = {
  id: 7, owner_id: 402, name: 'Kos A', address: 'Jl. Bromo', price: '350000',
  status: 'maintenance', type: 'Kamar Kos', facilities: ['AC'], image: '/demo/kos.jpg',
  booked_dates: ['2026-11-02'], owner_name: 'Pak Wahyu',
}

describe('adaptor unit', () => {
  it('memetakan enum dan harga', () => {
    expect(keUnit(dto)).toMatchObject({ status: 'Perawatan', price: 350000, owner_name: 'Pak Wahyu' })
  })

  it('memberi status aman untuk enum tak dikenal', () => {
    expect(keUnit({ ...dto, status: 'baru' }).status).toBe('Tersedia')
  })

  it('menerima daftar beramplop maupun langsung', () => {
    expect(keDaftarUnit({ data: [dto] })).toHaveLength(1)
    expect(keDaftarUnit([dto])).toHaveLength(1)
  })

  it('menerima enum Indonesia yang masih dikirim selama transisi', () => {
    expect(keUnit({ ...dto, status: 'Terisi' }).status).toBe('Terisi')
    expect(keUnit({ ...dto, status: 'Tersedia' }).status).toBe('Tersedia')
  })

  it('hanya menyimpan tanggal terisi yang berupa angka', () => {
    expect(keUnit(dto).booked_dates).toEqual([])
    expect(keUnit({ ...dto, booked_dates: [5, '7', 'bukan-angka', null, '', Number.NaN] }).booked_dates).toEqual([5, 7])
    expect(keUnit({ ...dto, booked_dates: '5' }).booked_dates).toEqual([])
  })

  it('memberi nilai aman saat bidang hilang atau bertipe salah', () => {
    const kosong = keUnit({})
    expect(kosong).toMatchObject({
      name: '',
      address: '',
      price: 0,
      status: 'Tersedia',
      type: 'Kamar Kos',
      facilities: [],
      image: '',
      booked_dates: [],
      owner_name: '',
    })
    expect(keUnit({ ...dto, price: 'bukan-angka' }).price).toBe(0)
    expect(keUnit({ ...dto, type: 'Gudang' }).type).toBe('Kamar Kos')
    expect(keDaftarUnit('bukan-daftar')).toEqual([])
  })
})
