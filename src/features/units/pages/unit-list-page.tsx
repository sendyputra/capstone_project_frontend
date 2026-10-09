import { Link } from 'react-router'
import { UnitTable } from '@/features/units/components/unit-table'
import { useDeleteUnit, useUbahStatusUnit, useUnits } from '@/features/units/api'
import { EmptyState } from '@/ui/empty-state'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'
import { useKonfirmasi } from '@/ui/confirm-dialog'
import { useToast } from '@/ui/toast'

function RangkaTabel() {
  return (
    <div className="space-y-2 rounded-xl border border-brand-border bg-brand-surface p-4">
      {[0, 1, 2, 3, 4].map((baris) => (
        <div key={baris} data-testid="baris-rangka">
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

export function UnitListPage() {
  const daftar = useUnits()
  const status = useUbahStatusUnit()
  const hapus = useDeleteUnit()
  const konfirmasi = useKonfirmasi()
  const { tampilkan } = useToast()

  async function mintaHapus(id: number, nama: string) {
    const setuju = await konfirmasi({
      judul: 'Hapus unit ini?',
      pesan: `Unit ${nama} tidak dapat dikembalikan.`,
      labelKonfirmasi: 'Hapus unit',
    })
    if (!setuju) return
    hapus.mutate(id, {
      onSuccess: () => tampilkan('Unit dihapus.', 'success'),
      onError: (galat) => tampilkan((galat as Error).message, 'danger'),
    })
  }

  return (
    <section className="mx-auto max-w-container space-y-6 px-4 py-8">
      <div className="flex flex-col justify-between gap-2 border-b border-brand-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-heading-m font-bold text-brand-text">Unit Saya</h1>
          <p className="text-micro text-brand-text-muted">Ubah status unit secara instan atau kelola jadwal terisi bulanan.</p>
        </div>
        <Link to="/pemilik/unit/baru" className="rounded-lg bg-brand-accent px-4 py-2 text-ui font-semibold text-brand-accent-fg">
          Tambah Unit Baru
        </Link>
      </div>

      {daftar.isPending && <RangkaTabel />}
      {daftar.isError && <ErrorState message={(daftar.error as Error).message} onRetry={() => daftar.refetch()} />}
      {daftar.isSuccess && daftar.data.length === 0 && (
        <EmptyState title="Belum ada unit" description="Tambahkan unit pertama Anda supaya bisa disewa." action={<Link className="font-semibold text-brand-accent" to="/pemilik/unit/baru">Tambah Unit Baru</Link>} />
      )}
      {daftar.isSuccess && daftar.data.length > 0 && (
        <UnitTable
          units={daftar.data}
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
