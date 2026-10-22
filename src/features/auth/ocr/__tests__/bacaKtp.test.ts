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
})
