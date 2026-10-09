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

  it('menampilkan halaman tidak ditemukan untuk jalur tak dikenal', async () => {
    renderRute('/tidak-ada')

    expect(await screen.findByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kembali ke beranda' })).toHaveAttribute('href', '/')
    /* Tetap di dalam kerangka aplikasi, bukan layar galat mentah React Router. */
    expect(screen.getByRole('link', { name: 'Beranda' })).toBeInTheDocument()
    expect(screen.queryByText(/Unexpected Application Error/)).not.toBeInTheDocument()
  })

  it('menampilkan beranda publik tanpa memaksa masuk', async () => {
    renderRute('/')

    expect(await screen.findByRole('heading', { name: /Langsung Dari Pemilik UMKM/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Masuk' })).not.toBeInTheDocument()
  })

  it('mengantar tamu dari tagihan ke layar masuk', async () => {
    renderRute('/tagihan')
    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
  })

  it('membuka katalog untuk pengunjung tanpa memaksa masuk', async () => {
    renderRute('/katalog')
    expect(await screen.findByRole('heading', { name: 'Daftar Unit Sewa Tersedia' })).toBeInTheDocument()
    expect(await screen.findByText('Kos Kamar 01')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Masuk' })).not.toBeInTheDocument()
  })

  it('menaruh katalog di beranda publik', async () => {
    renderRute('/')
    expect(await screen.findByRole('heading', { name: /Langsung Dari Pemilik UMKM/ })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Daftar Unit Sewa Tersedia' })).toBeInTheDocument()
  })

  it('membuka detail unit untuk pengunjung', async () => {
    renderRute('/katalog/1')
    expect(await screen.findByRole('heading', { name: 'Kos Kamar 01' })).toBeInTheDocument()
    expect(screen.getByText('Kalender Ketersediaan Tanggal:')).toBeInTheDocument()
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
