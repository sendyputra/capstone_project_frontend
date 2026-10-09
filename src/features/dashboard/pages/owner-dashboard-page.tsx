import { Link } from 'react-router'
import { useSession } from '@/features/auth/api'
import { useUnits } from '@/features/units/api'
import { OwnerStats } from '@/features/dashboard/components/owner-stats'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'

export function OwnerDashboardPage() {
  const daftar = useUnits()
  const { session } = useSession()

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
      {daftar.isSuccess && <OwnerStats units={daftar.data} />}
    </section>
  )
}
