import type { Unit } from '@/api/types'
import { Button } from '@/ui/button'
import { formatRupiah } from '@/lib/format'

export function UnitTable({ units, onUbahStatus, onHapus }: { units: Unit[]; onUbahStatus: (unit: Unit) => void; onHapus: (unit: Unit) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-brand-border bg-brand-surface">
      <table className="w-full min-w-[44rem] border-collapse text-ui">
        <thead className="bg-brand-surface-sunken text-micro uppercase tracking-label text-brand-text-muted">
          <tr>
            <th className="px-4 py-3 text-left">Nama unit</th>
            <th className="px-4 py-3 text-left">Lokasi</th>
            <th className="px-4 py-3 text-right">Harga / bulan</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => (
            <tr key={unit.id} className="border-t border-brand-border">
              <td className="px-4 py-3 font-semibold text-brand-text">{unit.name}</td>
              <td className="px-4 py-3 text-brand-text-muted">{unit.address}</td>
              <td className="px-4 py-3 text-right text-brand-text">{formatRupiah(unit.price)}</td>
              <td className="px-4 py-3">
                <span className={unit.status === 'Tersedia' ? 'rounded-full bg-brand-success-soft px-3 py-1 text-micro font-bold text-brand-success-soft-fg' : 'rounded-full bg-brand-danger-soft px-3 py-1 text-micro font-bold text-brand-danger-soft-fg'}>
                  {unit.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => onUbahStatus(unit)}>
                    Ubah status
                  </Button>
                  <Button variant="destructive" onClick={() => onHapus(unit)}>
                    Hapus
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
