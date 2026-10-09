import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { UnitFormPage } from '@/features/units/pages/unit-form-page'
import { RequireRole } from '@/app/guards'
import { readSession, writeSession } from '@/features/auth/session'
import { aktifkanSimulasi } from '@/api/mocks/handlers/units'
import { units } from '@/api/mocks/data/units'
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

  it('menyimpan sekali walau tombol ditekan dua kali cepat', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Nama / Judul Unit'), 'Kos Kamar 09')
    await userEvent.type(screen.getByLabelText('Lokasi Singkat'), 'Bandung')
    await userEvent.type(screen.getByLabelText('Harga per Bulan (Rp)'), '1200000')
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
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Unit' }))
    expect(await screen.findByText('Layar masuk')).toBeInTheDocument()
    expect(readSession()).toBeNull()
  })
})
