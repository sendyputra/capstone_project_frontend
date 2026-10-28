import { useState } from 'react'
import { useHapusBlok, useTambahBlok, useUnitBlocks } from '@/features/units/api'
import { useKonfirmasi } from '@/ui/confirm-dialog'
import { Skeleton } from '@/ui/skeleton'

/* Tanggal blok ditulis singkat ("10 Nov 2026") karena barisnya ringkas dan
   dibaca berdampingan dengan tanggal lain. */
function formatTanggalPendek(iso: string): string {
  const [tahun, bulan, hari] = iso.split('-').map(Number)
  if (!tahun || !bulan || !hari) return '—'
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(tahun, bulan - 1, hari)),
  )
}

export function BlokirTanggal({ unitId }: { unitId: number }) {
  const blok = useUnitBlocks(unitId)
  const tambah = useTambahBlok(unitId)
  const hapus = useHapusBlok(unitId)
  const konfirmasi = useKonfirmasi()
  const [mulai, setMulai] = useState('')
  const [selesai, setSelesai] = useState('')
  const [catatan, setCatatan] = useState('')
  const [galat, setGalat] = useState('')

  function kirim() {
    if (!mulai || !selesai) {
      setGalat('Tanggal blokir wajib diisi.')
      return
    }
    if (selesai < mulai) {
      setGalat('Tanggal selesai tidak boleh sebelum tanggal mulai.')
      return
    }
    setGalat('')
    tambah.mutate(
      { start_date: mulai, end_date: selesai, ...(catatan.trim() ? { note: catatan.trim() } : {}) },
      {
        onSuccess: () => {
          setMulai('')
          setSelesai('')
          setCatatan('')
        },
        onError: (eror) => setGalat((eror as Error).message),
      },
    )
  }

  async function mintaHapus(id: number, tanggal: string) {
    const setuju = await konfirmasi({
      judul: 'Hapus blokir tanggal ini?',
      pesan: `Blokir mulai ${formatTanggalPendek(tanggal)} akan dibuka kembali.`,
      labelKonfirmasi: 'Hapus blokir',
    })
    if (!setuju) return
    hapus.mutate(id, { onError: (eror) => setGalat((eror as Error).message) })
  }

  return (
    <div className="space-y-3 rounded-xl border border-brand-border bg-brand-surface p-4">
      <h2 className="text-ui font-bold text-brand-text">Blokir Tanggal</h2>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-ui font-semibold text-brand-text">
          Mulai blokir
          <input type="date" value={mulai} onChange={(e) => setMulai(e.target.value)} className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2" />
        </label>
        <label className="block text-ui font-semibold text-brand-text">
          Selesai blokir
          <input type="date" value={selesai} onChange={(e) => setSelesai(e.target.value)} className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2" />
        </label>
        <label className="block text-ui font-semibold text-brand-text sm:col-span-2">
          Catatan
          <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Renovasi, pembersihan, …" className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2" />
        </label>
      </div>

      <button
        type="button"
        onClick={kirim}
        disabled={tambah.isPending}
        className="rounded-lg bg-brand-accent px-4 py-2 text-ui font-semibold text-brand-accent-fg disabled:opacity-70"
      >
        {tambah.isPending ? 'Menyimpan…' : 'Blokir Tanggal'}
      </button>

      {galat && (
        <p role="alert" className="rounded-lg border border-brand-danger-border bg-brand-danger-soft p-2 text-micro text-brand-danger-soft-fg">
          {galat}
        </p>
      )}

      {blok.isPending && <Skeleton className="h-10" />}
      {blok.isSuccess && blok.data.length === 0 && <p className="text-micro text-brand-text-muted">Belum ada tanggal diblokir.</p>}
      {blok.isSuccess && blok.data.length > 0 && (
        <ul className="divide-y divide-brand-border">
          {blok.data.map((baris) => (
            <li key={baris.id} className="flex items-center justify-between gap-2 py-2 text-micro">
              <span className="text-brand-text">
                {formatTanggalPendek(baris.start_date)} – {formatTanggalPendek(baris.end_date)}
                {baris.note && <span className="ml-2 text-brand-text-muted">({baris.note})</span>}
              </span>
              <button
                type="button"
                onClick={() => mintaHapus(baris.id, baris.start_date)}
                className="rounded-lg px-2 py-1 font-semibold text-brand-danger"
              >
                Hapus blokir {baris.start_date}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
