import { act, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OccupancyChart } from '@/features/dashboard/components/occupancy-chart'
import { useChartPalette } from '@/ui/chart-palette'
import { renderWithProviders } from '@/test/render'
import type { Unit } from '@/api/types'

vi.mock('react-apexcharts', () => ({
  default: (props: { series: number[]; options: { chart?: { id?: string }; labels?: string[] } }) => (
    <div data-testid="apex" data-id={props.options.chart?.id} data-series={JSON.stringify(props.series)} data-labels={JSON.stringify(props.options.labels)} />
  ),
}))

function unit(over: Partial<Unit>): Unit {
  return { id: 1, owner_id: 402, name: 'A', address: 'X', price: 100, status: 'Tersedia', type: 'Kamar Kos', facilities: [], image: '', booked_dates: [], blocked_dates: [], ...over }
}

describe('OccupancyChart', () => {
  it('menampilkan jumlah terisi, tersedia, dan perawatan', async () => {
    renderWithProviders(<OccupancyChart units={[unit({ id: 1, status: 'Terisi' }), unit({ id: 2, status: 'Terisi' }), unit({ id: 3 })]} />)
    expect(await screen.findByRole('heading', { name: 'Okupansi Unit' })).toBeInTheDocument()
    const chart = await screen.findByTestId('apex')
    expect(chart.dataset.id).toBe('okupansi')
    expect(JSON.parse(chart.dataset.series ?? '[]')).toEqual([2, 1, 0])
    expect(JSON.parse(chart.dataset.labels ?? '[]')).toEqual(['Terisi', 'Tersedia', 'Perawatan'])
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
    vi.mocked(window.getComputedStyle).mockRestore()
    unmount()
  })
})
