import { RotateCcw, Search } from 'lucide-react'
import type { FilterUnit } from '@/features/units/use-filter-unit'
import { cn } from '@/lib/utils'

const TIPE = ['Kontrakan', 'Kamar Kos', 'Ruang Usaha', 'Apartemen']

/* Kendali mengikuti ukuran purwarupa apa adanya — isian `px-4 py-3`, pilihan
   `p-3`, tombol reset `p-3` — supaya tinggi ketiganya sejajar dalam satu baris.
   Komponen UI-kit bawaan lebih ramping, jadi tidak dipakai di sini. */
const gayaKendali =
  'w-full rounded-lg border border-brand-border bg-brand-bg text-ui text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent'

/* Kartu cari purwarupa. Di beranda ia duduk di dalam hero; di /katalog ia
   menjadi kepala seksi. Isinya sama, hanya pembungkusnya yang berbeda. */
export function FormCariUnit({ filter, className }: { filter: FilterUnit; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-brand-border bg-brand-surface p-5 text-brand-text', className)}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-3">
          <label htmlFor="cari-properti" className="mb-1 block text-label font-semibold text-brand-text-muted">
            <Search className="mr-1 inline h-3.5 w-3.5 text-brand-accent" aria-hidden="true" /> Cari Nama atau Lokasi Properti
          </label>
          <input
            id="cari-properti"
            type="text"
            value={filter.cari}
            onChange={(e) => filter.setCari(e.target.value)}
            placeholder="Ketik nama unit atau lokasi (misal: Bandung, Kos)..."
            className={cn(gayaKendali, 'px-4 py-3')}
          />
        </div>

        <div>
          <label htmlFor="tipe-properti" className="mb-1 block text-label font-semibold text-brand-text-muted">
            Tipe Properti
          </label>
          <select id="tipe-properti" className={cn(gayaKendali, 'p-3')} value={filter.tipe} onChange={(e) => filter.setTipe(e.target.value)}>
            <option value="Semua">Semua Tipe</option>
            {TIPE.map((nilai) => (
              <option key={nilai} value={nilai}>
                {nilai}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status-properti" className="mb-1 block text-label font-semibold text-brand-text-muted">
            Status Ketersediaan
          </label>
          <select id="status-properti" className={cn(gayaKendali, 'p-3')} value={filter.status} onChange={(e) => filter.setStatus(e.target.value)}>
            <option value="Semua">Semua Status</option>
            <option value="Tersedia">Siap Huni (Kosong)</option>
            <option value="Terisi">Terisi</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={filter.reset}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-surface-sunken p-3 text-ui font-medium text-brand-text transition hover:bg-brand-surface-sunken-hover"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>
    </div>
  )
}
