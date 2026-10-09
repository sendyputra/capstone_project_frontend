import { screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { writeSession, type Session } from '@/features/auth/session'
import { renderWithProviders } from '@/test/render'

const sesiPemilik: Session = {
  token: 'mock.abc.tanda',
  user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' },
}

const sesiPenyewa: Session = {
  token: 'mock.abc.tanda',
  user: { id: 404, name: 'Rian', email: 'rian@mail.com', role: 'penyewa' },
}

function renderRute(awal: string) {
  const router = createMemoryRouter(routes, { initialEntries: [awal] })
  return renderWithProviders(<RouterProvider router={router} />)
}

describe('peta rute', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('menampilkan beranda publik tanpa memaksa masuk', async () => {
    renderRute('/')

    expect(await screen.findByRole('heading', { name: /Langsung Dari Pemilik UMKM/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Masuk' })).not.toBeInTheDocument()
  })

  it('mengantar katalog penyewa ke layar masuk bila belum ada sesi', async () => {
    renderRute('/katalog')
    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
  })

  it('membuka katalog untuk peran penyewa', async () => {
    writeSession(sesiPenyewa)
    renderRute('/katalog')
    expect(await screen.findByRole('heading', { name: 'Daftar Unit Sewa Tersedia' })).toBeInTheDocument()
  })

  it('membuka dashboard pemilik untuk peran pemilik', async () => {
    writeSession(sesiPemilik)
    renderRute('/pemilik')
    expect(await screen.findByText('Total Unit Dikelola')).toBeInTheDocument()
  })

  it('mengantar pemilik ke 403 saat membuka rute admin', async () => {
    writeSession(sesiPemilik)
    renderRute('/admin/unit')
    expect(await screen.findByText('Halaman ini bukan untuk peran Anda')).toBeInTheDocument()
  })
})
