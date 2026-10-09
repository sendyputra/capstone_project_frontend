import { useUnit } from '@/features/units/api'
import { Skeleton } from '@/ui/skeleton'

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

/* Kalender bulan berjalan seperti purwarupa: nomor 1–31, tanggal terisi ditandai
   merah. Purwarupa belum memakai bulan sungguhan. */
export function KalenderKetersediaan({ tanggalTerisi }: { tanggalTerisi: number[] }) {
  return (
    <div className="grid grid-cols-7 gap-1 rounded-xl border border-brand-border bg-brand-bg p-3 text-center text-micro">
      {HARI.map((hari) => (
        <span key={hari} className="py-1 font-bold text-brand-text-subtle">{hari}</span>
      ))}
      {Array.from({ length: 31 }, (_, i) => i + 1).map((hari) => {
        const terisi = tanggalTerisi.includes(hari)
        return (
          <div
            key={hari}
            data-testid={`hari-${hari}`}
            className={`rounded-lg border p-2 font-semibold ${
              terisi
                ? 'border-brand-danger-border bg-brand-danger-soft text-brand-danger'
                : 'border-brand-success-border bg-brand-success-soft text-brand-success-soft-fg'
            }`}
          >
            {hari}
          </div>
        )
      })}
    </div>
  )
}

export function KalenderUnit({ id }: { id: number }) {
  const unit = useUnit(id)
  if (unit.isPending) return <Skeleton className="h-40" />
  if (!unit.data) return null
  return <KalenderKetersediaan tanggalTerisi={unit.data.booked_dates} />
}
