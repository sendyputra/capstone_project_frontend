import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LandingPage } from '@/features/landing/pages/landing-page'
import { renderWithProviders } from '@/test/render'

function renderBeranda() {
  return renderWithProviders(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )
}

function hero() {
  return document.getElementById('hero')!
}

describe('LandingPage', () => {
  it('menaruh kartu cari di dalam hero, seperti purwarupa', async () => {
    renderBeranda()

    expect(within(hero()).getByText('Sistem Reservasi & Pengelolaan Properti Terpadu')).toBeInTheDocument()
    expect(within(hero()).getByRole('heading', { level: 1, name: /Langsung Dari Pemilik UMKM/ })).toBeInTheDocument()
    expect(within(hero()).getByText(/tanpa komisi tersembunyi/)).toBeInTheDocument()
    expect(within(hero()).getByLabelText(/Cari Nama atau Lokasi Properti/)).toBeInTheDocument()
    expect(within(hero()).getByLabelText('Tipe Properti')).toBeInTheDocument()
    expect(within(hero()).getByLabelText('Status Ketersediaan')).toBeInTheDocument()
    expect(within(hero()).getByRole('button', { name: 'Reset Filter' })).toBeInTheDocument()
  })

  it('menyaring katalog di bawah hero dari isian hero', async () => {
    renderBeranda()
    expect(await screen.findByText('5 Unit Ditemukan')).toBeInTheDocument()

    await userEvent.type(within(hero()).getByLabelText(/Cari Nama atau Lokasi Properti/), 'ruko')

    expect(await screen.findByText('1 Unit Ditemukan')).toBeInTheDocument()
    expect(screen.getByText('Ruang Usaha Ruko Strategis')).toBeInTheDocument()
  })

  it('menampilkan katalog sebagai h2 karena hero memegang h1', async () => {
    renderBeranda()

    expect(await screen.findByRole('heading', { level: 2, name: 'Daftar Unit Sewa Tersedia' })).toBeInTheDocument()
    expect(await screen.findByText('Kos Kamar 01')).toBeInTheDocument()
  })
})
