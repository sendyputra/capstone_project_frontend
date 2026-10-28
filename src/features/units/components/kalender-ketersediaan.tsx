import { useState } from 'react'
import { useUnit } from '@/features/units/api'
import { tanggalHariIni } from '@/lib/tanggal'
import { Skeleton } from '@/ui/skeleton'

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function geserBulan(bulan: string, langkah: number): string {
  const [tahun, nomor] = bulan.split('-').map(Number)
  const total = tahun * 12 + (nomor - 1) + langkah
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

/* Hari pertama dihitung lewat `Date.UTC`, bukan `new Date(ISO)`: string tanggal
   tanpa jam dibaca sebagai tengah malam UTC, yang bisa bergeser sehari di zona
   waktu barat. */
function infoBulan(bulan: string) {
  const [tahun, nomor] = bulan.split('-').map(Number)
  const awal = new Date(Date.UTC(tahun, nomor - 1, 1))
  return {
    awalMinggu: awal.getUTCDay(),
    jumlahHari: new Date(Date.UTC(tahun, nomor, 0)).getUTCDate(),
    label: `${NAMA_BULAN[nomor - 1]} ${tahun}`,
  }
}

function kelasTanggal(iso: string, tanggalTerisi: string[], tanggalDiblokir: string[]): string {
  if (tanggalDiblokir.includes(iso)) return 'border-brand-warning bg-brand-warning-soft text-brand-warning-soft-fg'
  if (tanggalTerisi.includes(iso)) return 'border-brand-danger-border bg-brand-danger-soft text-brand-danger'
  return 'border-brand-success-border bg-brand-success-soft text-brand-success-soft-fg'
}

export function KalenderKetersediaan({
  tanggalTerisi,
  tanggalDiblokir = [],
}: {
  tanggalTerisi: string[]
  tanggalDiblokir?: string[]
}) {
  const [bulan, setBulan] = useState(() => tanggalHariIni().slice(0, 7))
  const { awalMinggu, jumlahHari, label } = infoBulan(bulan)

  return (
    <div className="grid grid-cols-7 gap-1 rounded-xl border border-brand-border bg-brand-bg p-3 text-center text-micro">
      <div className="col-span-7 flex items-center justify-between pb-1">
        <button
          type="button"
          aria-label="Bulan sebelumnya"
          onClick={() => setBulan((sekarang) => geserBulan(sekarang, -1))}
          className="rounded-lg px-2 py-1 font-bold text-brand-text-muted"
        >
          ‹
        </button>
        <span className="font-bold text-brand-text">{label}</span>
        <button
          type="button"
          aria-label="Bulan berikutnya"
          onClick={() => setBulan((sekarang) => geserBulan(sekarang, 1))}
          className="rounded-lg px-2 py-1 font-bold text-brand-text-muted"
        >
          ›
        </button>
      </div>

      {HARI.map((hari) => (
        <span key={hari} className="py-1 font-bold text-brand-text-subtle">{hari}</span>
      ))}
      {Array.from({ length: awalMinggu }, (_, i) => (
        <span key={`kosong-${i}`} />
      ))}
      {Array.from({ length: jumlahHari }, (_, i) => i + 1).map((hari) => {
        const iso = `${bulan}-${String(hari).padStart(2, '0')}`
        return (
          <div
            key={iso}
            data-testid={`tanggal-${iso}`}
            className={`rounded-lg border p-2 font-semibold ${kelasTanggal(iso, tanggalTerisi, tanggalDiblokir)}`}
          >
            {hari}
          </div>
        )
      })}

      <div className="col-span-7 flex flex-wrap items-center justify-center gap-4 pt-2 text-micro">
        <span className="flex items-center gap-1 text-brand-text-muted">
          <span className="inline-block h-3 w-3 rounded-full bg-brand-success" /> Tersedia
        </span>
        <span className="flex items-center gap-1 text-brand-text-muted">
          <span className="inline-block h-3 w-3 rounded-full bg-brand-danger" /> Terisi / Booked
        </span>
        <span className="flex items-center gap-1 text-brand-text-muted">
          <span className="inline-block h-3 w-3 rounded-full bg-brand-warning" /> Diblokir
        </span>
      </div>
    </div>
  )
}

export function KalenderUnit({ id }: { id: number }) {
  const unit = useUnit(id)
  if (unit.isPending) return <Skeleton className="h-40" />
  if (!unit.data) return null
  return <KalenderKetersediaan tanggalTerisi={unit.data.booked_dates} tanggalDiblokir={unit.data.blocked_dates} />
}
