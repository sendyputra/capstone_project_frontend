import type { Unit } from '@/api/types'

export function hitungStatistik(units: Unit[]) {
  const total = units.length
  const tersedia = units.filter((unit) => unit.status === 'Tersedia').length
  const terisi = total - tersedia
  const okupansi = total === 0 ? 0 : Math.round((terisi / total) * 100)
  return { total, tersedia, terisi, okupansi }
}

export function OwnerStats({ units }: { units: Unit[] }) {
  const { total, tersedia, terisi, okupansi } = hitungStatistik(units)
  const kartu = [
    { label: 'Total Unit', nilai: String(total) },
    { label: 'Tersedia', nilai: String(tersedia) },
    { label: 'Terisi', nilai: String(terisi) },
    { label: 'Okupansi', nilai: `${okupansi}%` },
  ]

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {kartu.map(({ label, nilai }) => (
        <div key={label} className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm">
          <p className="text-label font-semibold uppercase tracking-label text-brand-text-muted">{label}</p>
          <p className="mt-1 text-heading-l font-bold text-brand-text">{nilai}</p>
        </div>
      ))}
    </div>
  )
}
