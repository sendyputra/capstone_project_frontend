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

  /* API asli mengirim relasi bersarang (`tenant`, `unit.owner`), bukan bidang
     datar yang dipakai data contoh. Adaptor harus membaca keduanya. */
  it('membaca bentuk bersarang dari API asli', () => {
    const baris = keKontrak({
      id: 1, unit_id: 2, tenant_id: 3, start_date: '2026-11-01', end_date: '2027-01-31',
      total_price: 7_500_000, status: 'pending',
      tenant: { name: 'Siti', ktp_status: 'verified' },
      unit: { name: 'Kos A', owner: { name: 'Pak Wahyu' } },
    })
    expect(baris.renter_name).toBe('Siti')
    expect(baris.unit_title).toBe('Kos A')
    expect(baris.owner_name).toBe('Pak Wahyu')
    expect(baris.ktp).toBe('Terverifikasi')
  })

  it('menerima daftar langsung', () => {
    expect(keDaftarKontrak([])).toEqual([])
  })

  /* Kolom "KTP" di layar pemilik membaca `ktp` bila ada. Nilai asing tidak
     diteruskan — halaman yang menjatuhkannya ke "Belum". */
  it('memetakan status KTP hanya bila server mengirimnya', () => {
    expect(keKontrak({ ...dto, ktp: 'Terverifikasi' }).ktp).toBe('Terverifikasi')
    expect(keKontrak({ ...dto, ktp: 'Menunggu' }).ktp).toBe('Menunggu')
    expect(keKontrak(dto).ktp).toBeUndefined()
    expect(keKontrak({ ...dto, ktp: 'Ditolak' }).ktp).toBeUndefined()
  })

  /* DTO baru menamai bidang itu `ktp_status`; adaptor sesi sudah menerima kedua
     ejaan, jadi adaptor kontrak pun harus. Nilai asing tetap ditolak. */
  it('menerima ejaan ktp_status seperti adaptor sesi', () => {
    expect(keKontrak({ ...dto, ktp_status: 'Terverifikasi' }).ktp).toBe('Terverifikasi')
    expect(keKontrak({ ...dto, ktp_status: 'Menunggu' }).ktp).toBe('Menunggu')
    expect(keKontrak({ ...dto, ktp_status: 'Ditolak' }).ktp).toBeUndefined()
    expect(keKontrak({ ...dto, ktp_status: '' }).ktp).toBeUndefined()
    /* `ktp` didahulukan bila keduanya ada, sama seperti adaptor sesi. */
    expect(keKontrak({ ...dto, ktp: 'Menunggu', ktp_status: 'Terverifikasi' }).ktp).toBe('Menunggu')
  })

  /* Laravel menyerialkan kolom `date` sebagai tengah malam UTC, sehingga
     `2026-10-01` datang sebagai `2026-09-30T17:00:00.000000Z`. Memotong string
     apa adanya menggeser bulan tagihan ke September dan backend menolak
     pembayarannya. */
  it('mengembalikan tanggal kalender WIB dari serialisasi UTC', () => {
    const baris = keKontrak({
      ...dto,
      start_date: '2026-09-30T17:00:00.000000Z',
      end_date: '2027-09-29T17:00:00.000000Z',
      total_price: '18000000',
    })
    expect(baris.start_date).toBe('2026-10-01')
    expect(baris.end_date).toBe('2027-09-30')
    expect(baris).toMatchObject({ term: '12 bulan', monthly: 1_500_000 })
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

  /* Data contoh memakai akhir bulan sebagai tanggal selesai: 1 Sep 2026 –
     28 Feb 2027 adalah enam bulan sewa, dan tagihan bulanan yang diturunkan
     dari kontrak harus sama dengan harga bulanan unit (Rp 2.500.000). */
  it('membulatkan sisa hari menjadi bulan penuh', () => {
    expect(keKontrak({ ...dto, start_date: '2026-09-01', end_date: '2027-02-28', total_price: '15000000' })).toMatchObject({
      term: '6 bulan',
      monthly: 2_500_000,
    })
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
