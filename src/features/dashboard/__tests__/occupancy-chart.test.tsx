import { act, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OccupancyChart } from '@/features/dashboard/components/occupancy-chart'
import { useChartPalette } from '@/ui/chart-palette'
import { renderWithProviders } from '@/test/render'
import type { Unit } from '@/api/types'

vi.mock('react-apexcharts', () => ({
  default: (props: { series: number[]; options: Record<string, unknown> }) => (
    <div data-testid="apex" data-id={(props.options.chart as { id?: string })?.id} data-series={JSON.stringify(props.series)} data-options={JSON.stringify(props.options)} />
  ),
}))

/* Nilai per nama variabel: nama token yang salah ketik menghasilkan string
   kosong, sehingga tes ini gagal alih-alih diam-diam memakai warna bawaan
   ApexCharts. */
const TOKEN: Record<string, string> = {
  '--accent': '#111111',
  '--success-solid': '#222222',
  '--warning-solid': '#333333',
  '--text-muted': '#444444',
  '--border': '#555555',
  '--surface': '#666666',
}

function pakaiToken() {
  vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({ getPropertyValue: (nama: string) => TOKEN[nama] ?? '' }) as CSSStyleDeclaration)
}

afterEach(() => {
  vi.restoreAllMocks()
})

function unit(over: Partial<Unit>): Unit {
  return { id: 1, owner_id: 402, name: 'A', address: 'X', price: 100, status: 'Tersedia', type: 'Kamar Kos', facilities: [], image: '', booked_dates: [], blocked_dates: [], ...over }
}

function opsi(el: HTMLElement) {
  return JSON.parse(el.dataset.options ?? '{}') as {
    chart?: { id?: string; foreColor?: string }
    labels?: string[]
    colors?: string[]
    legend?: { labels?: { colors?: string } }
    stroke?: { colors?: string[] }
  }
}

describe('OccupancyChart', () => {
  it('menampilkan jumlah terisi, tersedia, dan perawatan', async () => {
    pakaiToken()
    renderWithProviders(<OccupancyChart units={[unit({ id: 1, status: 'Terisi' }), unit({ id: 2, status: 'Terisi' }), unit({ id: 3 })]} />)
    expect(await screen.findByRole('heading', { name: 'Okupansi Unit' })).toBeInTheDocument()
    const chart = await screen.findByTestId('apex')
    const o = opsi(chart)
    expect(o.chart?.id).toBe('okupansi')
    expect(JSON.parse(chart.dataset.series ?? '[]')).toEqual([2, 1, 0])
    expect(o.labels).toEqual(['Terisi', 'Tersedia', 'Perawatan'])
  })

  it('mewarnai potongan dan teks legenda dari token', async () => {
    pakaiToken()
    renderWithProviders(<OccupancyChart units={[unit({ id: 1, status: 'Terisi' })]} />)
    const o = opsi(await screen.findByTestId('apex'))
    expect(o.colors).toEqual(['#111111', '#222222', '#333333'])
    expect(o.legend?.labels?.colors).toBe('#444444')
    expect(o.stroke?.colors).toEqual(['#666666'])
    expect(o.chart?.foreColor).toBe('#444444')
  })

  it('tetap render dengan seri nol saat tidak ada unit', async () => {
    renderWithProviders(<OccupancyChart units={[]} />)
    const chart = await screen.findByTestId('apex')
    expect(JSON.parse(chart.dataset.series ?? '[]')).toEqual([0, 0, 0])
  })
})

describe('useChartPalette', () => {
  it('membaca ulang token saat tema berganti', async () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () => ({ getPropertyValue: (nama: string) => (document.documentElement.dataset.theme === 'dark' ? `${nama}-gelap` : `${nama}-terang`) }) as CSSStyleDeclaration,
    )
    const { result, unmount } = renderHook(() => useChartPalette())

    expect(result.current.accent).toBe('--accent-terang')
    await act(async () => {
      document.documentElement.dataset.theme = 'dark'
    })
    expect(result.current.accent).toBe('--accent-gelap')

    delete document.documentElement.dataset.theme
    unmount()
  })
})
