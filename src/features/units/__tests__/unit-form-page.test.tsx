import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { UnitFormPage } from '@/features/units/pages/unit-form-page'
import { RequireRole } from '@/app/guards'
import { readSession, writeSession } from '@/features/auth/session'
import { aktifkanSimulasi } from '@/api/mocks/handlers/simulasi'
import { units } from '@/api/mocks/data/units'
import { pantauBadanForm } from '@/test/metode'
import { renderWithProviders } from '@/test/render'

function renderHalaman() {
  writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
  return renderWithProviders(
    <MemoryRouter initialEntries={['/pemilik/unit/baru']}>
      <Routes>
        <Route path="/pemilik/unit/baru" element={<UnitFormPage />} />
        <Route path="/pemilik/unit" element={<p>Daftar unit</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('UnitFormPage', () => {
  it('menampilkan galat di bawah bidang dan ringkasan saat nama kosong', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Harga per Bulan (Rp)'), '1200000')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Unit' }))
    expect(await screen.findByText(/Nama unit belum diisi/i)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/Ada isian yang perlu diperbaiki/i)
  })

  /* Backend mewajibkan `type`. Tanpa bidang ini POST /units ditolak 422 dengan
     pesan mentah Laravel, dan pemilik tidak bisa menambah unit sama sekali. */
  it('mengirim tipe properti yang dipilih', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Nama / Judul Unit'), 'Ruko Uji Tipe')
    await userEvent.type(screen.getByLabelText('Lokasi Singkat'), 'Surabaya')
    await userEvent.type(screen.getByLabelText('Harga per Bulan (Rp)'), '3000000')
    await userEvent.selectOptions(screen.getByLabelText('Tipe Properti'), 'Ruang Usaha')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Unit' }))

    await waitFor(() => expect(screen.getByText('Daftar unit')).toBeInTheDocument())
    expect(units.find((unit) => unit.name === 'Ruko Uji Tipe')?.type).toBe('Ruang Usaha')
  })

  /* Fasilitas satu bagian per butir di bawah `facilities[]`; perekamannya lewat
     spy `init.body` karena serializer MSW menggugurkan bidang berama ganda. */
  it('mengirim fasilitas hasil pecahan koma, tanpa string kosong', async () => {
    const badan = pantauBadanForm()
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Nama / Judul Unit'), 'Kos Fasilitas Uji')
    await userEvent.type(screen.getByLabelText('Lokasi Singkat'), 'Surabaya')
    await userEvent.type(screen.getByLabelText('Harga per Bulan (Rp)'), '1200000')
    await userEvent.selectOptions(screen.getByLabelText('Tipe Properti'), 'Kamar Kos')
    await userEvent.type(screen.getByLabelText('Fasilitas (pisahkan dengan koma)'), ' WiFi,  , AC, ')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Unit' }))
    await waitFor(() => expect(screen.getByText('Daftar unit')).toBeInTheDocument())
    expect(badan[0]?.getAll('facilities[]')).toEqual(['WiFi', 'AC'])
  })

  /* `userEvent.upload` diam pada berkas di luar `accept` input, jadi cabang
     "jenis salah" diuji dengan `fireEvent.change` dan `files` ditanam — jalur
     handler sama seperti pilihan peramban lewat penyaring "Semua berkas". */
  it('menolak foto yang bukan gambar dengan pesan sebab dan saran', async () => {
    renderHalaman()
    const input = screen.getByLabelText('Foto unit')
    const nota = new File(['x'], 'nota.txt', { type: 'text/plain' })
    Object.defineProperty(input, 'files', { value: [nota], configurable: true })
    fireEvent.change(input)
    expect(await screen.findByText(/Jenis berkas tidak didukung/i)).toBeInTheDocument()
  })

  it('menolak foto di atas 2 MB', async () => {
    renderHalaman()
    const besar = new File([new ArrayBuffer(2 * 1024 * 1024 + 1)], 'gede.jpg', { type: 'image/jpeg' })
    await userEvent.upload(screen.getByLabelText('Foto unit'), besar)
    expect(await screen.findByText(/melebihi 2 MB/i)).toBeInTheDocument()
  })

  it('menyimpan sekali walau tombol ditekan dua kali cepat', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Nama / Judul Unit'), 'Kos Kamar 09')
    await userEvent.type(screen.getByLabelText('Lokasi Singkat'), 'Bandung')
    await userEvent.type(screen.getByLabelText('Harga per Bulan (Rp)'), '1200000')
    await userEvent.selectOptions(screen.getByLabelText('Tipe Properti'), 'Kamar Kos')
    const tombol = screen.getByRole('button', { name: 'Simpan Unit' })
    await userEvent.dblClick(tombol)
    await waitFor(() => expect(screen.getByText('Daftar unit')).toBeInTheDocument())
    expect(units.filter((unit) => unit.name === 'Kos Kamar 09')).toHaveLength(1)
  })

  it('menampilkan sebab dan coba ulang saat penyimpanan pertama gagal', async () => {
    aktifkanSimulasi()
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Nama / Judul Unit'), 'Kos Kamar 11')
    await userEvent.type(screen.getByLabelText('Lokasi Singkat'), 'Bandung')
    await userEvent.type(screen.getByLabelText('Harga per Bulan (Rp)'), '1500000')
    await userEvent.selectOptions(screen.getByLabelText('Tipe Properti'), 'Kamar Kos')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Unit' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/koneksi terputus/i)
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Unit' }))
    await waitFor(() => expect(screen.getByText('Daftar unit')).toBeInTheDocument())
  })

  it('menolak harga nol dengan pesan yang menyebut jalan keluarnya', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Nama / Judul Unit'), 'Kos Kamar 12')
    await userEvent.type(screen.getByLabelText('Lokasi Singkat'), 'Bandung')
    await userEvent.type(screen.getByLabelText('Harga per Bulan (Rp)'), '0')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Unit' }))
    expect(await screen.findByText(/Harga harus lebih besar dari nol/i)).toBeInTheDocument()
  })

  it('membuang sesi dan mengantar ke layar masuk saat penyimpanan dijawab 401', async () => {
    const { server } = await import('@/api/mocks/server')
    const { http, HttpResponse } = await import('msw')
    server.use(http.post('/units', () => HttpResponse.json({ message: 'Sesi tidak sah.' }, { status: 401 })))
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    renderWithProviders(
      <MemoryRouter initialEntries={['/pemilik/unit/baru']}>
        <Routes>
          <Route path="/masuk" element={<p>Layar masuk</p>} />
          <Route path="/pemilik/unit/baru" element={<RequireRole role="pemilik"><UnitFormPage /></RequireRole>} />
          <Route path="/pemilik/unit" element={<p>Daftar unit</p>} />
        </Routes>
      </MemoryRouter>,
    )
    await userEvent.type(await screen.findByLabelText('Nama / Judul Unit'), 'Kos Kamar 13')
    await userEvent.type(screen.getByLabelText('Lokasi Singkat'), 'Bandung')
    await userEvent.type(screen.getByLabelText('Harga per Bulan (Rp)'), '1200000')
    await userEvent.selectOptions(screen.getByLabelText('Tipe Properti'), 'Kamar Kos')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Unit' }))
    expect(await screen.findByText('Layar masuk')).toBeInTheDocument()
    expect(readSession()).toBeNull()
  })
})
