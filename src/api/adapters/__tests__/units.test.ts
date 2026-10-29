import { describe, expect, it } from 'vitest'
import { dariStatusUnit, keDaftarUnit, keStatusUnit, keUnit } from '@/api/adapters/units'

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

  /* Mock sudah bicara enum backend; label Indonesia yang datang dari luar enum
     tidak lagi diteruskan (`Terisi` akan menyamar jadi status sah). */
  it('menolak label Indonesia sebagai status', () => {
    expect(keStatusUnit('Terisi')).toBe('Tersedia')
    expect(keStatusUnit('Perawatan')).toBe('Tersedia')
  })

  it('mengirim enum backend untuk tiap label tampilan', () => {
    expect(dariStatusUnit('Tersedia')).toBe('available')
    expect(dariStatusUnit('Terisi')).toBe('rented')
    expect(dariStatusUnit('Perawatan')).toBe('maintenance')
  })

  /* Backend boleh menyimpan `image` relatif (`/uploads/...`). Pelengkapan origin
     API diuji di `client.test.ts`; di sini cukup memastikan adaptor memakai
     jalur yang aman saat env kosong (seperti di tes). */
  it('membiarkan gambar absolut dan aset mock apa adanya', () => {
    expect(keUnit({ ...dto, image: 'https://cdn.example/kos.jpg' }).image).toBe('https://cdn.example/kos.jpg')
    expect(keUnit({ ...dto, image: '/demo/kos.jpg' }).image).toBe('/demo/kos.jpg')
  })

  it('meneruskan tanggal ISO apa adanya', () => {
    const unit = keUnit({ id: 1, booked_dates: ['2026-11-02'], blocked_dates: ['2026-11-05'] })
    expect(unit.booked_dates).toEqual(['2026-11-02'])
    expect(unit.blocked_dates).toEqual(['2026-11-05'])
  })

  it('membuang tanggal yang bukan ISO', () => {
    expect(keUnit({ id: 1, booked_dates: [5, '2026-11-02', 'besok'], blocked_dates: [null, '', '2026-11-05'] }).booked_dates).toEqual(['2026-11-02'])
    expect(keUnit({ ...dto, booked_dates: [5, '2026-11-02', 'besok'] }).blocked_dates).toEqual([])
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
      blocked_dates: [],
      owner_name: '',
    })
    expect(keUnit({ ...dto, price: 'bukan-angka' }).price).toBe(0)
    expect(keUnit({ ...dto, type: 'Gudang' }).type).toBe('Kamar Kos')
    expect(keDaftarUnit('bukan-daftar')).toEqual([])
  })
})
