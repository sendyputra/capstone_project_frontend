import { useMemo, useState } from 'react'
import { useUnits } from '@/features/units/api'
import { UnitCard } from '@/features/units/components/unit-card'
import { Button } from '@/ui/button'
import { ErrorState } from '@/ui/error-state'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Skeleton } from '@/ui/skeleton'

const TIPE = ['Kontrakan', 'Kamar Kos', 'Ruang Usaha', 'Apartemen']

const gayaKendali = 'w-full rounded-lg border border-brand-border-strong bg-brand-bg p-3 text-ui text-brand-text'

export function KatalogPage() {
  const daftar = useUnits()
  const [cari, setCari] = useState('')
  const [tipe, setTipe] = useState('Semua')
  const [status, setStatus] = useState('Semua')

  const hasil = useMemo(() => {
    return (daftar.data ?? []).filter((unit) => {
      const kata = `${unit.name} ${unit.address}`.toLowerCase()
      const cocokCari = kata.includes(cari.trim().toLowerCase())
      const cocokTipe = tipe === 'Semua' || unit.type === tipe
      const cocokStatus = status === 'Semua' || unit.status === status
      return cocokCari && cocokTipe && cocokStatus
    })
  }, [daftar.data, cari, tipe, status])

  function reset() {
    setCari('')
    setTipe('Semua')
    setStatus('Semua')
  }

  return (
    <section className="mx-auto max-w-container px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-brand-border pb-4">
        <div>
          <h1 className="text-heading-m font-bold text-brand-text">Daftar Unit Sewa Tersedia</h1>
          <p className="mt-1 text-ui text-brand-text-muted">Pilih unit sesuai kebutuhan dan cek kalender ketersediaan secara rinci.</p>
        </div>
        <span className="rounded-full bg-brand-accent-track px-3 py-2 text-micro font-bold text-brand-accent-soft-fg">{hasil.length} Unit Ditemukan</span>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-brand-border bg-brand-surface p-5 md:grid-cols-3">
        <div className="space-y-1 md:col-span-3">
          <Label htmlFor="cari-properti">Cari Nama atau Lokasi Properti</Label>
          <Input id="cari-properti" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Ketik nama unit atau lokasi (misal: Bandung, Kos)..." />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tipe-properti">Tipe Properti</Label>
          <select id="tipe-properti" className={gayaKendali} value={tipe} onChange={(e) => setTipe(e.target.value)}>
            <option value="Semua">Semua Tipe</option>
            {TIPE.map((nilai) => (
              <option key={nilai} value={nilai}>{nilai}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="status-properti">Status Ketersediaan</Label>
          <select id="status-properti" className={gayaKendali} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Semua">Semua Status</option>
            <option value="Tersedia">Siap Huni (Kosong)</option>
            <option value="Terisi">Terisi</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="button" variant="outline" className="w-full" onClick={reset}>
            Reset Filter
          </Button>
        </div>
      </div>

      {daftar.isPending && (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-80" />
          ))}
        </div>
      )}

      {daftar.isError && (
        <div className="mt-6">
          <ErrorState message={(daftar.error as Error).message} onRetry={() => daftar.refetch()} />
        </div>
      )}

      {daftar.isSuccess && hasil.length > 0 && (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {hasil.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      )}

      {daftar.isSuccess && hasil.length === 0 && (
        <p className="mt-6 rounded-xl border border-brand-border bg-brand-surface py-12 text-center font-medium text-brand-text-muted">
          Tidak ada unit sewa yang sesuai dengan kriteria pencarian Anda.
        </p>
      )}
    </section>
  )
}
