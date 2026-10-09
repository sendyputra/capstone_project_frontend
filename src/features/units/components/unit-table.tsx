import { Link } from 'react-router'
import type { UnitRow } from '@/api/types'
import { formatRupiah } from '@/lib/format'
import { StatusChip } from '@/ui/status-chip'
import { Tabel } from '@/ui/tabel'

export function UnitTable({
  units,
  sibuk,
  onUbahStatus,
  onHapus,
  tampilkanPemilik = false,
}: {
  units: UnitRow[]
  sibuk?: boolean
  onUbahStatus: (unit: UnitRow) => void
  onHapus: (unit: UnitRow) => void
  tampilkanPemilik?: boolean
}) {
  const kolom = ['Info Unit', ...(tampilkanPemilik ? ['Pemilik'] : []), 'Tipe & Lokasi', 'Harga / Bulan', 'Status Unit', 'Kelola Kalender', 'Aksi']

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface shadow-sm">
      <Tabel kolom={kolom}>
        {units.map((unit) => (
          <tr key={unit.id} className="hover:bg-brand-bg">
            <td className="p-4">
              <div className="flex items-center gap-3">
                <img src={unit.image} alt="" className="h-12 w-12 rounded-lg border border-brand-border object-cover" />
                <span className="text-ui font-bold text-brand-text">{unit.name}</span>
              </div>
            </td>
            {tampilkanPemilik && <td className="p-4 font-medium text-brand-text-muted">{unit.owner_name}</td>}
            <td className="p-4">
              <span className="block font-semibold text-brand-text">{unit.type}</span>
              <span className="text-micro text-brand-text-subtle">{unit.address}</span>
            </td>
            <td className="p-4 font-extrabold text-brand-accent">{formatRupiah(unit.price)}</td>
            <td className="p-4">
              <button type="button" disabled={sibuk} onClick={() => onUbahStatus(unit)} aria-label={`Ubah status ${unit.name}`} className="flex items-center gap-1 rounded-full px-3 py-1 text-micro font-bold shadow-sm disabled:opacity-60">
                <StatusChip nilai={unit.status} />
              </button>
            </td>
            <td className="p-4 text-center">
              <Link to={`/pemilik/unit/${unit.id}`} className="inline-block rounded-lg border border-brand-accent-border bg-brand-accent-soft px-3 py-2 text-ui font-semibold text-brand-accent">
                Set Kalender
              </Link>
            </td>
            <td className="p-4 text-right">
              <button type="button" disabled={sibuk} onClick={() => onHapus(unit)} className="rounded-lg p-2 text-brand-danger disabled:opacity-60" title="Hapus Unit" aria-label="Hapus">
                Hapus
              </button>
            </td>
          </tr>
        ))}
      </Tabel>
    </div>
  )
}
