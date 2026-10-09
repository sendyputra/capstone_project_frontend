import { Link } from 'react-router'
import { useUnits } from '@/features/units/api'
import { OwnerStats } from '@/features/dashboard/components/owner-stats'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'

export function OwnerDashboardPage() {
  const daftar = useUnits()

  return (
    <section className="mx-auto max-w-container space-y-8 px-4 py-8">
      <div className="rounded-xl bg-brand-surface-inverse p-6 text-brand-text-inverse">
        <h2 className="text-heading-l font-bold">Selamat datang</h2>
        <p className="mt-1 text-ui">Kelola ketersediaan unit kos, kontrakan, dan ruang usaha Anda di satu tempat.</p>
        <Link to="/pemilik/unit/baru" className="mt-4 inline-block rounded-md bg-brand-accent px-4 py-2 text-ui font-bold text-brand-accent-fg">
          Tambah Unit Baru
        </Link>
      </div>

      {daftar.isPending && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>}
      {daftar.isError && <ErrorState message={(daftar.error as Error).message} onRetry={() => daftar.refetch()} />}
      {daftar.isSuccess && <OwnerStats units={daftar.data} />}
    </section>
  )
}
