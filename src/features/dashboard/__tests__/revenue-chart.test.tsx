import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RevenueChart } from '@/features/dashboard/components/revenue-chart'
import { tanggalHariIni } from '@/lib/tanggal'
import { renderWithProviders } from '@/test/render'
import type { PaymentRow } from '@/api/types'

vi.mock('react-apexcharts', () => ({
  default: (props: { series: Array<{ name: string; data: number[] }>; options: Record<string, unknown> }) => (
    <div data-testid="apex" data-id={(props.options.chart as { id?: string })?.id} data-series={JSON.stringify(props.series)} data-options={JSON.stringify(props.options)} />
  ),
}))

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

function bayar(over: Partial<PaymentRow>): PaymentRow {
  return { id: 1, contract_id: 1, month: '2026-10', amount: 100, status: 'Lunas', proof_url: '', renter_name: 'A', unit_title: 'B', ...over }
}

function opsi(el: HTMLElement) {
  return JSON.parse(el.dataset.options ?? '{}') as {
    chart?: { id?: string; foreColor?: string }
    colors?: string[]
    grid?: { borderColor?: string }
    xaxis?: { categories?: string[]; labels?: { style?: { colors?: string } } }
    yaxis?: { labels?: { style?: { colors?: string } } }
  }
}

describe('RevenueChart', () => {
  it('menjumlahkan bulan berjalan dan menampilkan enam bulan di sumbu', async () => {
    const bulanIni = tanggalHariIni().slice(0, 7)
    renderWithProviders(
      <RevenueChart
        pembayaran={[bayar({ id: 1, contract_id: 1, month: bulanIni, amount: 200 }), bayar({ id: 2, contract_id: 2, month: bulanIni, amount: 300 })]}
      />,
    )

    expect(await screen.findByRole('heading', { name: 'Pendapatan 6 Bulan Terakhir' })).toBeInTheDocument()
    const chart = await screen.findByTestId('apex')
    const seri = JSON.parse(chart.dataset.series ?? '[]') as Array<{ name: string; data: number[] }>
    expect(opsi(chart).chart?.id).toBe('pendapatan')
    expect(seri).toHaveLength(1)
    expect(seri[0].name).toBe('Pendapatan')
    expect(seri[0].data.at(-1)).toBe(500)
    expect(opsi(chart).xaxis?.categories).toHaveLength(6)
  })

  it('mewarnai batang, kisi, dan teks sumbu dari token', async () => {
    pakaiToken()
    renderWithProviders(<RevenueChart pembayaran={[]} />)
    const o = opsi(await screen.findByTestId('apex'))
    expect(o.colors).toEqual(['#111111'])
    expect(o.grid?.borderColor).toBe('#555555')
    expect(o.chart?.foreColor).toBe('#444444')
    expect(o.xaxis?.labels?.style?.colors).toBe('#444444')
    expect(o.yaxis?.labels?.style?.colors).toBe('#444444')
  })

  it('tetap render dengan semua nol saat tidak ada pembayaran', async () => {
    renderWithProviders(<RevenueChart pembayaran={[]} />)
    const chart = await screen.findByTestId('apex')
    const seri = JSON.parse(chart.dataset.series ?? '[]') as Array<{ name: string; data: number[] }>
    expect(seri[0].data).toEqual([0, 0, 0, 0, 0, 0])
  })
})
