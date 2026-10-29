import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RevenueChart } from '@/features/dashboard/components/revenue-chart'
import { tanggalHariIni } from '@/lib/tanggal'
import { renderWithProviders } from '@/test/render'
import type { PaymentRow } from '@/api/types'

vi.mock('react-apexcharts', () => ({
  default: (props: { series: Array<{ name: string; data: number[] }>; options: { chart?: { id?: string }; xaxis?: { categories?: string[] } } }) => (
    <div data-testid="apex" data-id={props.options.chart?.id} data-series={JSON.stringify(props.series)} data-categories={JSON.stringify(props.options.xaxis?.categories)} />
  ),
}))

function bayar(over: Partial<PaymentRow>): PaymentRow {
  return { id: 1, contract_id: 1, month: '2026-10', amount: 100, status: 'Lunas', proof_url: '', renter_name: 'A', unit_title: 'B', ...over }
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
    expect(chart.dataset.id).toBe('pendapatan')
    expect(seri).toHaveLength(1)
    expect(seri[0].name).toBe('Pendapatan')
    expect(seri[0].data.at(-1)).toBe(500)
    expect(JSON.parse(chart.dataset.categories ?? '[]')).toHaveLength(6)
  })

  it('tetap render dengan semua nol saat tidak ada pembayaran', async () => {
    renderWithProviders(<RevenueChart pembayaran={[]} />)
    const chart = await screen.findByTestId('apex')
    const seri = JSON.parse(chart.dataset.series ?? '[]') as Array<{ name: string; data: number[] }>
    expect(seri[0].data).toEqual([0, 0, 0, 0, 0, 0])
  })
})
