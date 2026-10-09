import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { hitungStatistik } from '@/features/dashboard/components/owner-stats'
import { OwnerDashboardPage } from '@/features/dashboard/pages/owner-dashboard-page'
import { writeSession } from '@/features/auth/session'
import { renderWithProviders } from '@/test/render'

describe('hitungStatistik', () => {
  it('menghitung total, tersedia, terisi, dan okupansi bulat', () => {
    expect(
      hitungStatistik([
        { id: 1, owner_id: 402, name: 'A', address: 'X', price: 100, status: 'Tersedia' },
        { id: 2, owner_id: 402, name: 'B', address: 'X', price: 100, status: 'Terisi' },
        { id: 3, owner_id: 402, name: 'C', address: 'X', price: 100, status: 'Terisi' },
      ]),
    ).toEqual({ total: 3, tersedia: 1, terisi: 2, okupansi: 67 })
  })

  it('aman untuk daftar kosong', () => {
    expect(hitungStatistik([])).toEqual({ total: 0, tersedia: 0, terisi: 0, okupansi: 0 })
  })
})

describe('OwnerDashboardPage', () => {
  it('menampilkan empat kartu angka dari unit pemilik yang masuk', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    renderWithProviders(
      <MemoryRouter>
        <OwnerDashboardPage />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText('Total Unit')).toBeInTheDocument())
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('67%')).toBeInTheDocument()
  })
})
