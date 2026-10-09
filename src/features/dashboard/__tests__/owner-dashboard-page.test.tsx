import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { hitungStatistik } from '@/features/dashboard/components/owner-stats'
import { OwnerDashboardPage } from '@/features/dashboard/pages/owner-dashboard-page'
import { masukSebagai } from '@/test/sesi'
import { renderWithProviders } from '@/test/render'
import type { Unit } from '@/api/types'

function unit(over: Partial<Unit>): Unit {
  return { id: 1, owner_id: 402, name: 'A', address: 'X', price: 100, status: 'Tersedia', type: 'Kamar Kos', facilities: [], image: '', booked_dates: [], ...over }
}

describe('hitungStatistik', () => {
  it('menghitung total, tersedia, terisi, dan pendapatan dari unit terisi', () => {
    expect(hitungStatistik([unit({ id: 1 }), unit({ id: 2, status: 'Terisi' }), unit({ id: 3, status: 'Terisi' })])).toEqual({
      total: 3,
      tersedia: 1,
      terisi: 2,
      pendapatan: 200,
    })
  })

  it('aman untuk daftar kosong', () => {
    expect(hitungStatistik([])).toEqual({ total: 0, tersedia: 0, terisi: 0, pendapatan: 0 })
  })
})

describe('OwnerDashboardPage', () => {
  it('menyapa pemilik dengan namanya dan menampilkan empat angka', async () => {
    masukSebagai(402, 'pemilik', 'Pak Wahyu')
    renderWithProviders(
      <MemoryRouter>
        <OwnerDashboardPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Selamat Datang, Pak Wahyu!' })).toBeInTheDocument()
    expect(await screen.findByText('Total Unit Dikelola')).toBeInTheDocument()
    expect(screen.getByText('3 Unit')).toBeInTheDocument()
    expect(screen.getByText('Unit Kosong / Siap Huni')).toBeInTheDocument()
    expect(screen.getByText('Rp 2.500.000')).toBeInTheDocument()
  })
})
