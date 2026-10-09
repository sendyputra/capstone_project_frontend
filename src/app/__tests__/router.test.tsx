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

function renderRute(awal: string) {
  const router = createMemoryRouter(routes, { initialEntries: [awal] })
  return renderWithProviders(<RouterProvider router={router} />)
}

describe('peta rute', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('mengantar pengunjung tanpa sesi dari beranda ke layar masuk', async () => {
    renderRute('/')
    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
  })

  it('membuka dashboard pemilik untuk peran pemilik', async () => {
    writeSession(sesiPemilik)
    renderRute('/pemilik')
    expect(await screen.findByText('Total Unit')).toBeInTheDocument()
  })

  it('mengantar pemilik ke 403 saat membuka rute admin', async () => {
    writeSession(sesiPemilik)
    renderRute('/admin/unit')
    expect(await screen.findByText('Halaman ini bukan untuk peran Anda')).toBeInTheDocument()
  })
})
