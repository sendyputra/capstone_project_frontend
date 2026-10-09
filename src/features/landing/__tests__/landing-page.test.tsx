import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LandingPage } from '@/features/landing/pages/landing-page'
import { renderWithProviders } from '@/test/render'

describe('LandingPage', () => {
  it('menyajikan hero dan katalog dalam satu halaman untuk pengunjung', async () => {
    renderWithProviders(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Sistem Reservasi & Pengelolaan Properti Terpadu')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Langsung Dari Pemilik UMKM/ })).toBeInTheDocument()
    expect(screen.getByText(/tanpa komisi tersembunyi/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Masuk' })).toHaveAttribute('href', '/masuk')

    /* Katalog ikut di beranda, bukan hanya di /katalog. */
    expect(await screen.findByRole('heading', { name: 'Daftar Unit Sewa Tersedia' })).toBeInTheDocument()
    expect(await screen.findByText('Kos Kamar 01')).toBeInTheDocument()
    expect(screen.getByText(/Unit Ditemukan/)).toBeInTheDocument()
  })
})
