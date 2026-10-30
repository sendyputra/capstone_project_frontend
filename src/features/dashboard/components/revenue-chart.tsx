import { Suspense, lazy } from 'react'
import type { PaymentRow } from '@/api/types'
import { hitungPendapatanBulanan, labelBulanSingkat } from '@/features/dashboard/lib/chart-data'
import { formatRupiah } from '@/lib/format'
import { tanggalHariIni } from '@/lib/tanggal'
import { useChartPalette } from '@/ui/chart-palette'
import { ChartBoundary } from '@/ui/chart-boundary'
import { Skeleton } from '@/ui/skeleton'

const ApexChart = lazy(() => import('react-apexcharts'))

/* Batang = uang yang benar-benar masuk, jadi hanya baris `Lunas`. Bulan tanpa
   pembayaran tetap muncul sebagai nol supaya sumbu waktunya tidak bohong. */
export function RevenueChart({ pembayaran }: { pembayaran: PaymentRow[] }) {
  const palet = useChartPalette()
  const titik = hitungPendapatanBulanan(pembayaran, tanggalHariIni().slice(0, 7))

  return (
    <section data-testid="grafik-pendapatan" className="space-y-3 rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
      <h2 className="text-heading-s font-bold text-brand-text">Pendapatan 6 Bulan Terakhir</h2>
      <p className="text-micro text-brand-text-muted">Hanya pembayaran berstatus Lunas.</p>
      <ChartBoundary>
        <Suspense fallback={<Skeleton className="h-64" />}>
          <ApexChart
            type="bar"
            height={280}
            series={[{ name: 'Pendapatan', data: titik.map((baris) => baris.jumlah) }]}
            options={{
              chart: { id: 'pendapatan', type: 'bar', background: 'transparent', foreColor: palet.textMuted },
              plotOptions: { bar: { borderRadius: 6 } },
              colors: [palet.accent],
              grid: { borderColor: palet.border },
              xaxis: { categories: titik.map((baris) => labelBulanSingkat(baris.bulan)), labels: { style: { colors: palet.textMuted } } },
              yaxis: { labels: { formatter: formatRupiah, style: { colors: palet.textMuted } } },
              tooltip: { y: { formatter: formatRupiah } },
              dataLabels: { enabled: false },
            }}
          />
        </Suspense>
      </ChartBoundary>
    </section>
  )
}
