import { UnitTable } from '@/features/units/components/unit-table'
import { useDeleteUnit, useUbahStatusUnit, useUnits } from '@/features/units/api'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'
import { useKonfirmasi } from '@/ui/confirm-dialog'
import { useToast } from '@/ui/toast'

export function AdminUnitPage() {
  const daftar = useUnits()
  const status = useUbahStatusUnit()
  const hapus = useDeleteUnit()
  const konfirmasi = useKonfirmasi()
  const { tampilkan } = useToast()

  async function mintaHapus(id: number, nama: string) {
    const setuju = await konfirmasi({ judul: 'Hapus unit ini?', pesan: `Unit ${nama} tidak dapat dikembalikan.`, labelKonfirmasi: 'Hapus unit' })
    if (!setuju) return
    hapus.mutate(id, {
      onSuccess: () => tampilkan('Unit dihapus.', 'success'),
      onError: (galat) => tampilkan((galat as Error).message, 'danger'),
    })
  }

  return (
    <section className="space-y-6 rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
      <div className="border-b border-brand-border pb-4">
        <h2 className="text-heading-s font-bold text-brand-text">Kelola Unit Lintas Pemilik</h2>
        <p className="text-micro text-brand-text-muted">Seluruh unit dari semua pemilik; ubah status ketersediaan atau hapus unit.</p>
      </div>

      {daftar.isPending && <Skeleton className="h-40" />}
      {daftar.isError && <ErrorState message={(daftar.error as Error).message} onRetry={() => daftar.refetch()} />}
      {daftar.isSuccess && (
        <UnitTable
          units={daftar.data}
          tampilkanPemilik
          sibuk={status.isPending || hapus.isPending}
          onUbahStatus={(unit) => {
            status.mutate(
              { id: unit.id, status: unit.status === 'Tersedia' ? 'Terisi' : 'Tersedia' },
              {
                onSuccess: () => tampilkan('Status unit diperbarui.', 'success'),
                onError: (galat) => tampilkan((galat as Error).message, 'danger'),
              },
            )
          }}
          onHapus={(unit) => mintaHapus(unit.id, unit.name)}
        />
      )}
    </section>
  )
}
