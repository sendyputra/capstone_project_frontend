import { Link } from 'react-router'
import { useSession } from '@/features/auth/api'
import { useContracts } from '@/features/contracts/api'
import { usePayments } from '@/features/billing/api'
import { useMyUnits } from '@/features/units/api'
import { OwnerStats } from '@/features/dashboard/components/owner-stats'
import { OccupancyChart } from '@/features/dashboard/components/occupancy-chart'
import { RevenueChart } from '@/features/dashboard/components/revenue-chart'
import { formatBulan, formatRupiah, formatTanggal } from '@/lib/format'
import { susunTagihan } from '@/lib/tagihan'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/ui/empty-state'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'

const HARI_INGAT = 60

function tanggalMendatang(hari: number): string {
  const tanggal = new Date()
  tanggal.setDate(tanggal.getDate() + hari)
  return tanggal.toISOString().slice(0, 10)
}

export function OwnerDashboardPage() {
  const daftar = useMyUnits()
  const kontrak = useContracts()
  const pembayaran = usePayments()
  const { session } = useSession()

  const hariIni = new Date().toISOString().slice(0, 10)
  const tagihan = susunTagihan(kontrak.data ?? [], pembayaran.data ?? [], hariIni)
  const tunggakan = tagihan.filter((baris) => baris.status === 'Belum Bayar')
  const batasHabis = tanggalMendatang(HARI_INGAT)
  const akanHabis = (kontrak.data ?? []).filter(
    (baris) => baris.status === 'Aktif' && baris.end_date !== '' && baris.end_date <= batasHabis,
  )

  return (
    <section className="mx-auto max-w-container space-y-8 px-4 py-8">
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-panel p-6 text-brand-text-inverse shadow-xl md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-brand-teal-500 bg-brand-teal-900 px-3 py-1 text-micro font-bold uppercase tracking-label text-brand-teal-300">
              Dashboard Pemilik
            </span>
            <span className="text-micro text-brand-text-subtle">UMKM Properti Nusantara</span>
          </div>
          <h1 className="mt-1 text-heading-l font-extrabold">Selamat Datang, {session?.user.name}!</h1>
          <p className="mt-1 text-ui text-brand-neutral-300">Kelola ketersediaan unit kos, kontrakan, dan ruang usaha Anda di satu tempat.</p>
        </div>
        <Link to="/pemilik/unit/baru" className="rounded-xl bg-brand-owner px-4 py-3 text-ui font-bold text-brand-text-inverse shadow-lg">
          Tambah Unit Baru
        </Link>
      </div>

      {daftar.isPending && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}
      {daftar.isError && <ErrorState message={(daftar.error as Error).message} onRetry={() => daftar.refetch()} />}
      {daftar.isSuccess && daftar.data.length === 0 && (
        <EmptyState
          title="Belum ada unit"
          description="Tambahkan unit pertama Anda supaya statistik dan pendapatan mulai terisi."
          action={
            <Link className="font-semibold text-brand-accent" to="/pemilik/unit/baru">
              Tambah Unit Baru
            </Link>
          }
        />
      )}
      {daftar.isSuccess && daftar.data.length > 0 && <OwnerStats units={daftar.data} />}

      {daftar.isSuccess && daftar.data.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          <OccupancyChart units={daftar.data} />
          {pembayaran.isSuccess && <RevenueChart pembayaran={pembayaran.data} />}
        </div>
      )}

      {(kontrak.isPending || pembayaran.isPending) && (
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}
      {(kontrak.isError || pembayaran.isError) && (
        <ErrorState
          message={((kontrak.error ?? pembayaran.error) as Error).message}
          onRetry={() => {
            void kontrak.refetch()
            void pembayaran.refetch()
          }}
        />
      )}
      {kontrak.isSuccess && pembayaran.isSuccess && (
        <div className="grid gap-5 md:grid-cols-2">
          <section className="space-y-3 rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-heading-s font-bold text-brand-text">Tunggakan</h2>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-micro font-bold',
                  tunggakan.length === 0 ? 'bg-brand-surface-sunken text-brand-text-muted' : 'bg-brand-danger-soft text-brand-danger-soft-fg',
                )}
              >
                {tunggakan.length} tagihan
              </span>
            </div>
            <p className="text-ui text-brand-text-muted">
              {tunggakan.length === 0 ? 'Tidak ada tagihan yang belum dibayar.' : `Total ${formatRupiah(tunggakan.reduce((jumlah, baris) => jumlah + baris.amount, 0))}`}
            </p>
            {tunggakan.length > 0 && (
              <ul className="space-y-1 text-micro text-brand-text-muted">
                {tunggakan.slice(0, 3).map((baris) => (
                  <li key={baris.kunci} className="flex justify-between gap-2">
                    <span className="font-semibold text-brand-text">{baris.unit_title}</span>
                    <span>
                      {formatBulan(baris.month)} · {formatRupiah(baris.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-heading-s font-bold text-brand-text">Kontrak Akan Habis</h2>
              <span className="rounded-full bg-brand-warning-soft px-3 py-1 text-micro font-bold text-brand-warning-soft-fg">{akanHabis.length} kontrak</span>
            </div>
            <p className="text-ui text-brand-text-muted">
              {akanHabis.length === 0 ? `Tidak ada kontrak yang berakhir dalam ${HARI_INGAT} hari.` : `Berakhir dalam ${HARI_INGAT} hari ke depan.`}
            </p>
            {akanHabis.length > 0 && (
              <ul className="space-y-1 text-micro text-brand-text-muted">
                {akanHabis.slice(0, 3).map((baris) => (
                  <li key={baris.id} className="flex justify-between gap-2">
                    <span className="font-semibold text-brand-text">{baris.unit_title}</span>
                    <span>{formatTanggal(baris.end_date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
