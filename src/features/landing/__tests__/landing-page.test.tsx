import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LandingPage } from '@/features/landing/pages/landing-page'
import { renderWithProviders } from '@/test/render'

describe('LandingPage', () => {
  it('menjelaskan nilai dan menyediakan jalan masuk', () => {
    renderWithProviders(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Sistem Reservasi & Pengelolaan Properti Terpadu')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Cari Kontrakan, Kos, & Ruang Usaha/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Langsung Dari Pemilik UMKM/ })).toBeInTheDocument()
    expect(screen.getByText(/tanpa komisi tersembunyi/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Masuk' })).toHaveAttribute('href', '/masuk')
  })
})
