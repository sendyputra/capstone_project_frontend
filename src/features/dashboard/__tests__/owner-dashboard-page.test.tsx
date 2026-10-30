import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { hitungStatistik } from '@/features/dashboard/components/owner-stats'
import { OwnerDashboardPage } from '@/features/dashboard/pages/owner-dashboard-page'
import { server } from '@/api/mocks/server'
import { masukSebagai } from '@/test/sesi'
import { renderWithProviders } from '@/test/render'
import type { Unit } from '@/api/types'

vi.mock('react-apexcharts', () => ({
  default: (props: { series: unknown; options: { chart?: { id?: string }; xaxis?: { categories?: string[] } } }) => (
    <div data-testid="apex" data-id={props.options.chart?.id} data-series={JSON.stringify(props.series)} data-categories={JSON.stringify(props.options.xaxis?.categories)} />
  ),
}))

function unit(over: Partial<Unit>): Unit {
  return { id: 1, owner_id: 402, name: 'A', address: 'X', price: 100, status: 'Tersedia', type: 'Kamar Kos', facilities: [], image: '', booked_dates: [], blocked_dates: [], ...over }
}

describe('hitungStatistik', () => {
  it('menghitung total, tersedia, terisi, dan pendapatan dari unit terisi', () => {
    expect(hitungStatistik([unit({ id: 1 }), unit({ id: 2, status: 'Terisi' }), unit({ id: 3, status: 'Terisi' })])).toEqual({
      total: 3,
      tersedia: 1,
      terisi: 2,
      perawatan: 0,
      pendapatan: 200,
    })
  })

  it('tidak menghitung unit perawatan sebagai terisi', () => {
    expect(hitungStatistik([unit({ id: 1 }), unit({ id: 2, status: 'Terisi' }), unit({ id: 3, status: 'Perawatan' })])).toEqual({
      total: 3,
      tersedia: 1,
      terisi: 1,
      perawatan: 1,
      pendapatan: 100,
    })
  })

  it('aman untuk daftar kosong', () => {
    expect(hitungStatistik([])).toEqual({ total: 0, tersedia: 0, terisi: 0, perawatan: 0, pendapatan: 0 })
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
    expect(screen.getByText('6 Unit')).toBeInTheDocument()
    expect(screen.getByText('Unit Kosong / Siap Huni')).toBeInTheDocument()
    expect(screen.getByText('Rp 3.800.000')).toBeInTheDocument()
    expect(screen.getByText('1 unit sedang dalam perawatan dan tidak dihitung sebagai terisi.')).toBeInTheDocument()

    /* Fitur wajib dashboard: tunggakan dan kontrak yang akan habis. Kontrak
       201 belum membayar Oktober; kontrak 206 berakhir 31 Okt 2026. */
    expect(await screen.findByText('Tunggakan')).toBeInTheDocument()
    expect(screen.getByText('1 tagihan')).toBeInTheDocument()
    expect(screen.getByText('Total Rp 2.500.000')).toBeInTheDocument()
    expect(screen.getByText('Kontrak Akan Habis')).toBeInTheDocument()
    expect(screen.getByText('1 kontrak')).toBeInTheDocument()
    expect(screen.getByText('Kos Kamar 03')).toBeInTheDocument()

    const okupansi = await screen.findByTestId('grafik-okupansi')
    expect(okupansi).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByTestId('apex')).toHaveLength(2))
    const grafik = screen.getAllByTestId('apex')

    const donut = grafik.find((el) => el.dataset.id === 'okupansi')
    expect(JSON.parse(donut?.dataset.series ?? '[]')).toEqual([2, 3, 1])

    const batang = grafik.find((el) => el.dataset.id === 'pendapatan')
    expect(JSON.parse(batang?.dataset.categories ?? '[]')).toHaveLength(6)
  })

  it('tidak menampilkan grafik saat pemilik belum punya unit', async () => {
    masukSebagai(402, 'pemilik', 'Pak Wahyu')
    server.use(
      http.get('/units', () => HttpResponse.json({ current_page: 1, last_page: 1, per_page: 10, total: 0, data: [] })),
    )
    renderWithProviders(
      <MemoryRouter>
        <OwnerDashboardPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Belum ada unit')).toBeInTheDocument()
    expect(screen.queryByTestId('grafik-okupansi')).toBeNull()
    expect(screen.queryByTestId('grafik-pendapatan')).toBeNull()
  })
})
