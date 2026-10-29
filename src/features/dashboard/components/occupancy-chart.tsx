import { Suspense, lazy } from 'react'
import type { Unit } from '@/api/types'
import { hitungStatistik } from '@/features/dashboard/components/owner-stats'
import { useChartPalette } from '@/ui/chart-palette'
import { Skeleton } from '@/ui/skeleton'

/* ApexCharts ±500 KB; dimuat terpisah supaya dashboard tetap ringan pada
   kunjungan pertama. */
const ApexChart = lazy(() => import('react-apexcharts'))

export function OccupancyChart({ units }: { units: Unit[] }) {
  const { terisi, tersedia, perawatan } = hitungStatistik(units)
  const palet = useChartPalette()

  return (
    <section data-testid="grafik-okupansi" className="space-y-3 rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
      <h2 className="text-heading-s font-bold text-brand-text">Okupansi Unit</h2>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <ApexChart
          type="donut"
          height={280}
          series={[terisi, tersedia, perawatan]}
          options={{
            chart: { id: 'okupansi', type: 'donut', background: 'transparent' },
            labels: ['Terisi', 'Tersedia', 'Perawatan'],
            colors: [palet.accent, palet.success, palet.warning],
            legend: { labels: { colors: palet.textMuted } },
            stroke: { colors: [palet.surface] },
            dataLabels: { enabled: false },
          }}
        />
      </Suspense>
    </section>
  )
}
