import { useState } from 'react'
import { Link } from 'react-router'
import type { Unit } from '@/api/types'
import { DeleteUnitDialog } from '@/features/units/components/delete-unit-dialog'
import { UnitTable } from '@/features/units/components/unit-table'
import { useDeleteUnit, useUnits, useUpdateUnit } from '@/features/units/api'
import { EmptyState } from '@/ui/empty-state'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'
import { useToast } from '@/ui/toast'
import { Button } from '@/ui/button'

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
  const ubah = useUpdateUnit()
  const hapus = useDeleteUnit()
  const { tampilkan } = useToast()
  const [dihapus, setDihapus] = useState<Unit | null>(null)

  return (
    <section className="mx-auto max-w-container space-y-6 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-heading-m font-bold text-brand-text">Unit Saya</h2>
        <Button nativeButton={false} render={<Link to="/pemilik/unit/baru" />}>Tambah Unit Baru</Button>
      </div>

      {daftar.isPending && <RangkaTabel />}
      {daftar.isError && <ErrorState message={(daftar.error as Error).message} onRetry={() => daftar.refetch()} />}
      {daftar.isSuccess && daftar.data.length === 0 && (
        <EmptyState title="Belum ada unit" description="Tambahkan unit pertama Anda supaya bisa disewa." action={<Link className="font-semibold text-brand-accent" to="/pemilik/unit/baru">Tambah Unit Baru</Link>} />
      )}
      {daftar.isSuccess && daftar.data.length > 0 && (
        <UnitTable
          units={daftar.data}
          sibuk={ubah.isPending || hapus.isPending}
          onUbahStatus={(unit) => {
            ubah.mutate(
              { id: unit.id, status: unit.status === 'Tersedia' ? 'Terisi' : 'Tersedia' },
              {
                onSuccess: () => tampilkan('Status unit diperbarui.', 'success'),
                onError: (galat) => tampilkan((galat as Error).message, 'danger'),
              },
            )
          }}
          onHapus={(unit) => setDihapus(unit)}
        />
      )}

      <DeleteUnitDialog
        open={Boolean(dihapus)}
        nama={dihapus?.name ?? ''}
        onBatal={() => setDihapus(null)}
        onSetuju={() => {
          if (!dihapus) return
          hapus.mutate(dihapus.id, {
            onSuccess: () => { tampilkan('Unit dihapus.', 'success'); setDihapus(null) },
            onError: (galat) => tampilkan((galat as Error).message, 'danger'),
          })
        }}
      />
    </section>
  )
}
