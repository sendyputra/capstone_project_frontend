import { useUnits } from '@/features/units/api'
import { FormCariUnit } from '@/features/units/components/form-cari-unit'
import { UnitCard } from '@/features/units/components/unit-card'
import { useFilterUnit, type FilterUnit } from '@/features/units/use-filter-unit'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'

/* Katalog bisa berdiri sendiri di /katalog — ia lalu memegang filternya sendiri —
   atau menerima filter dari beranda, yang kartunya ada di dalam hero. */
export function KatalogPage({ filter: filterMilikHalaman, tampilkanForm = true }: { filter?: FilterUnit; tampilkanForm?: boolean }) {
  const milikSendiri = useFilterUnit()
  const filter = filterMilikHalaman ?? milikSendiri
  const daftar = useUnits()
  const hasil = filter.saring(daftar.data ?? [])

  return (
    <section className="mx-auto max-w-container px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-brand-border pb-4">
        <div>
          <h2 className="text-heading-m font-bold text-brand-text">Daftar Unit Sewa Tersedia</h2>
          <p className="mt-1 text-ui text-brand-text-muted">Pilih unit sesuai kebutuhan dan cek kalender ketersediaan secara rinci.</p>
        </div>
        <span className="rounded-full bg-brand-accent-track px-3 py-2 text-micro font-bold text-brand-accent-soft-fg">{hasil.length} Unit Ditemukan</span>
      </div>

      {tampilkanForm && <FormCariUnit filter={filter} className="mt-6" />}

      {daftar.isPending && (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-80" />
          ))}
        </div>
      )}

      {daftar.isError && (
        <div className="mt-6">
          <ErrorState message={(daftar.error as Error).message} onRetry={() => daftar.refetch()} />
        </div>
      )}

      {daftar.isSuccess && hasil.length > 0 && (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {hasil.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      )}

      {daftar.isSuccess && hasil.length === 0 && (
        <p className="mt-6 rounded-xl border border-brand-border bg-brand-surface py-12 text-center font-medium text-brand-text-muted">
          Tidak ada unit sewa yang sesuai dengan kriteria pencarian Anda.
        </p>
      )}
    </section>
  )
}
