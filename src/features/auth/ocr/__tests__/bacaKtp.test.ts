import { beforeEach, describe, expect, it, vi } from 'vitest'

const recognize = vi.fn()
vi.mock('tesseract.js', () => ({ recognize: (...args: unknown[]) => recognize(...args) }))

import { bacaKtp } from '@/features/auth/ocr/bacaKtp'

const berkas = new File(['x'], 'ktp.png', { type: 'image/png' })

describe('bacaKtp', () => {
  beforeEach(() => recognize.mockReset())

  it('mengambil NIK 16 digit dan nama', async () => {
    recognize.mockResolvedValue({ data: { text: 'PROVINSI JAWA TIMUR\nNIK : 3578123456780001\nNama : BUDI SANTOSO\nAlamat : Jl. Bromo' } })
    expect(await bacaKtp(berkas)).toEqual({ nik: '3578123456780001', nama: 'BUDI SANTOSO', yakin: true })
  })

  it('menandai tidak yakin bila NIK tidak ada', async () => {
    recognize.mockResolvedValue({ data: { text: 'Nama : BUDI SANTOSO' } })
    expect(await bacaKtp(berkas)).toMatchObject({ nik: '', yakin: false })
  })

  it('mengosongkan nama bila label tidak ada', async () => {
    recognize.mockResolvedValue({ data: { text: 'NIK : 3578123456780001' } })
    expect(await bacaKtp(berkas)).toMatchObject({ nama: '', yakin: false })
  })

  it('memanggil Tesseract dengan berkas dan bahasa Indonesia', async () => {
    recognize.mockResolvedValue({ data: { text: 'NIK : 3578123456780001\nNama : BUDI SANTOSO' } })
    await bacaKtp(berkas)
    expect(recognize).toHaveBeenCalledWith(berkas, 'ind')
  })

  it('membaca NIK berlabel yang dipisah spasi sebagai 16 digit', async () => {
    recognize.mockResolvedValue({ data: { text: 'NIK : 3578 1234 5678 0001\nNama : BUDI SANTOSO' } })
    expect(await bacaKtp(berkas)).toEqual({ nik: '3578123456780001', nama: 'BUDI SANTOSO', yakin: true })
  })

  it('tidak yakin bila NIK berlabel terbaca tanpa nama', async () => {
    recognize.mockResolvedValue({ data: { text: 'NIK : 3578 1234 5678 0001' } })
    expect(await bacaKtp(berkas)).toMatchObject({ nik: '3578123456780001', nama: '', yakin: false })
  })

  it('mengosongkan NIK berlabel yang tercampur huruf', async () => {
    recognize.mockResolvedValue({ data: { text: 'NIK : 3578 1234 5678 OOO1\nNama : BUDI SANTOSO' } })
    expect(await bacaKtp(berkas)).toEqual({ nik: '', nama: 'BUDI SANTOSO', yakin: false })
  })

  it('mengosongkan NIK berlabel yang bukan tepat 16 digit', async () => {
    recognize.mockResolvedValue({ data: { text: 'NIK : 3578 1234 5678 00011\nNama : BUDI SANTOSO' } })
    expect(await bacaKtp(berkas)).toMatchObject({ nik: '', yakin: false })
  })

  /* Dua teks di bawah disalin dari keluaran tesseract.js atas
     `assets/ktp/ktp1.jpeg` dan `ktp2.jpeg` setelah gambar dibuat abu-abu.
     NIK terbaca salah pada digit provinsi (ktp1) dan satu digit tanggal
     (ktp2); nama provinsi dan tanggal lahir tetap terbaca dan dipakai
     mengoreksi. */
  it('mengoreksi kode provinsi dari nama provinsi', async () => {
    recognize.mockResolvedValue({
      data: {
        text: [
          'PROVINSI SULAWESI SELATAN',
          'KABUPATEN SOPPENG',
          'NIK : 231204251072 0002',
          'Nama : ABDURRAUF, S.Pd, M.Pd',
          'Tempat/Tgl Lahir - CELLENGENGE, 25-10-1972',
        ].join('\n'),
      },
    })
    expect(await bacaKtp(berkas)).toEqual({ nik: '7312042510720002', nama: 'ABDURRAUF SPD MPD', yakin: true })
  })

  it('mengoreksi tanggal lahir pada NIK', async () => {
    recognize.mockResolvedValue({
      data: {
        text: [
          'PROVINSI JAWA TIMUR',
          'KABUPATEN SIDOARJO',
          'NIK : 3578120405 840002',
          'Nama : SENDY PUTRA WIRATAMA',
          'Tempat/Tgl Lahir - SURABAYA, 04-06-1984',
        ].join('\n'),
      },
    })
    expect(await bacaKtp(berkas)).toEqual({ nik: '3578120406840002', nama: 'SENDY PUTRA WIRATAMA', yakin: true })
  })

  it('memilih penghapusan yang tepat saat OCR menyisipkan satu digit', async () => {
    recognize.mockResolvedValue({
      data: {
        text: [
          'PROVINSI JAWA TIMUR',
          'NIK : 35781201406840002',
          'Nama : SENDY PUTRA WIRATAMA',
          'Tempat/Tgl Lahir - SURABAYA, 04-06-1984',
        ].join('\n'),
      },
    })
    expect(await bacaKtp(berkas)).toMatchObject({ nik: '3578120406840002' })
  })

  /* Keluaran nyata peramban untuk `ktp2.jpeg`: satu digit tanggal terbaca
     sebagai huruf b, sehingga baris NIK hanya memuat 15 digit. */
  it('memulihkan satu digit yang terbaca sebagai huruf', async () => {
    recognize.mockResolvedValue({
      data: {
        text: [
          'PROVINSI JAWA TIMUR',
          'NIK : 357812040b840002',
          'Nama : SENDY PUTRA WIRATAMA',
          'Tempat/Tgl Lahir - SURABAYA, 04-06-1984',
        ].join('\n'),
      },
    })
    expect(await bacaKtp(berkas)).toMatchObject({ nik: '3578120406840002' })
  })

  it('menambahkan 40 pada tanggal perempuan', async () => {
    recognize.mockResolvedValue({
      data: {
        text: [
          'PROVINSI JAWA TIMUR',
          'NIK : 3578124406840002',
          'Nama : SITI AMINAH',
          'Jenis kelamin : PEREMPUAN',
          'Tempat/Tgl Lahir : SURABAYA, 04-06-1984',
        ].join('\n'),
      },
    })
    expect(await bacaKtp(berkas)).toMatchObject({ nik: '3578124406840002' })
  })

  it('tidak menebak NIK bila tanggal pada NIK jauh dari tanggal lahir', async () => {
    recognize.mockResolvedValue({
      data: {
        text: ['PROVINSI JAWA TIMUR', 'NIK : 3578120101900002', 'Nama : BUDI SANTOSO', 'Tempat/Tgl Lahir : SURABAYA, 04-06-1984'].join(
          '\n',
        ),
      },
    })
    expect(await bacaKtp(berkas)).toEqual({ nik: '', nama: 'BUDI SANTOSO', yakin: false })
  })
})
