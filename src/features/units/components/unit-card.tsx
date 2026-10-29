import { MapPin } from 'lucide-react'
import { Link } from 'react-router'
import type { UnitRow } from '@/api/types'
import { formatRupiah } from '@/lib/format'

/* Lencana duduk di atas foto, jadi butuh latar pekat, bukan nada lembut seperti
   StatusChip di dalam tabel. Nada bahaya hanya untuk status yang perlu
   ditindak; unit terisi adalah keadaan normal. */
const nadaStatus: Record<string, string> = {
  Tersedia: 'bg-brand-success text-brand-success-fg',
  Terisi: 'bg-brand-accent text-brand-accent-fg',
}

export function UnitCard({ unit }: { unit: UnitRow }) {
  return (
    <article className="flex flex-col justify-between overflow-hidden rounded-xl border border-brand-border bg-brand-surface shadow-sm">
      <div>
        <div className="relative">
          <img src={unit.image} alt={unit.name} className="h-48 w-full object-cover" />
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-micro font-semibold shadow ${nadaStatus[unit.status] ?? 'bg-brand-warning-soft text-brand-warning-soft-fg'}`}
          >
            {unit.status}
          </span>
          <span className="absolute right-3 top-3 rounded bg-brand-scrim px-2 py-1 text-micro text-brand-text-inverse">{unit.type}</span>
        </div>
        <div className="space-y-3 p-5">
          <h3 className="text-lg font-bold text-brand-text">{unit.name}</h3>
          <p className="flex items-center gap-2 text-micro text-brand-text-muted">
            <MapPin className="h-3.5 w-3.5 text-brand-owner" aria-hidden="true" />
            <span>{unit.address}</span>
          </p>
          <div className="flex flex-wrap gap-2 border-y border-brand-border py-2 text-micro text-brand-text-muted">
            {unit.facilities.map((fasilitas) => (
              <span key={fasilitas} className="rounded bg-brand-surface-sunken px-2 py-1">
                {fasilitas}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between p-5 pt-0">
        <div>
          <span className="block text-micro text-brand-text-subtle">Harga Sewa</span>
          <span className="text-body font-extrabold text-brand-accent">{formatRupiah(unit.price)} / bln</span>
        </div>
        <Link
          to={`/katalog/${unit.id}`}
          className="rounded-lg bg-brand-accent-soft px-4 py-2 text-ui font-semibold text-brand-accent"
        >
          Detail Unit
        </Link>
      </div>
    </article>
  )
}
