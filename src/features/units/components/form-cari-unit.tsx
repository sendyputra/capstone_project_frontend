import type { FilterUnit } from '@/features/units/use-filter-unit'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { cn } from '@/lib/utils'

const TIPE = ['Kontrakan', 'Kamar Kos', 'Ruang Usaha', 'Apartemen']

const gayaKendali = 'w-full rounded-lg border border-brand-border-strong bg-brand-bg p-3 text-ui text-brand-text'

/* Kartu cari purwarupa. Di beranda ia duduk di dalam hero; di /katalog ia
   menjadi kepala seksi. Isinya sama, hanya pembungkusnya yang berbeda. */
export function FormCariUnit({ filter, className }: { filter: FilterUnit; className?: string }) {
  return (
    <div className={cn('grid gap-3 rounded-2xl border border-brand-border bg-brand-surface p-5 text-brand-text md:grid-cols-3', className)}>
      <div className="space-y-1 md:col-span-3">
        <Label htmlFor="cari-properti">Cari Nama atau Lokasi Properti</Label>
        <Input
          id="cari-properti"
          value={filter.cari}
          onChange={(e) => filter.setCari(e.target.value)}
          placeholder="Ketik nama unit atau lokasi (misal: Bandung, Kos)..."
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="tipe-properti">Tipe Properti</Label>
        <select id="tipe-properti" className={gayaKendali} value={filter.tipe} onChange={(e) => filter.setTipe(e.target.value)}>
          <option value="Semua">Semua Tipe</option>
          {TIPE.map((nilai) => (
            <option key={nilai} value={nilai}>
              {nilai}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="status-properti">Status Ketersediaan</Label>
        <select id="status-properti" className={gayaKendali} value={filter.status} onChange={(e) => filter.setStatus(e.target.value)}>
          <option value="Semua">Semua Status</option>
          <option value="Tersedia">Siap Huni (Kosong)</option>
          <option value="Terisi">Terisi</option>
        </select>
      </div>

      <div className="flex items-end">
        <Button type="button" variant="outline" className="w-full" onClick={filter.reset}>
          Reset Filter
        </Button>
      </div>
    </div>
  )
}
