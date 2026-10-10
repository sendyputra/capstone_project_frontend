import { screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { routes } from '@/app/router'
import { renderWithProviders } from '@/test/render'

/* Satu layar sengaja meledak saat dirender, untuk menguji penangkap galat pada
   peta rute sungguhan — bukan komponennya sendirian. */
vi.mock('@/features/units/pages/katalog-page', () => ({
  KatalogPage: () => {
    throw new Error('Layar katalog meledak')
  },
}))

describe('penangkap galat rute', () => {
  it('menampilkan halaman ramah saat layar gagal dirender', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/katalog'] })
    renderWithProviders(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: 'Terjadi gangguan di halaman ini' })).toBeInTheDocument()
    expect(screen.queryByText(/Unexpected Application Error/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kembali ke beranda' })).toHaveAttribute('href', '/')
  })
})
