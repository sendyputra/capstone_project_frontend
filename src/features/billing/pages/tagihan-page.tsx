import { useState } from 'react'
import { usePayments, useUnggahBukti } from '@/features/billing/api'
import { useContracts } from '@/features/contracts/api'
import { formatBulan, formatRupiah } from '@/lib/format'
import { susunTagihan, type Tagihan } from '@/lib/tagihan'
import { tanggalHariIni } from '@/lib/tanggal'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'
import { StatusChip } from '@/ui/status-chip'
import { Tabel } from '@/ui/tabel'
import { useToast } from '@/ui/toast'

type MasukanUnggah = { contract_id: number; month: string; amount: number; proof: File }

/* Bukti bayar tersimpan sebagai jalur berkas (`/bukti/…`), sedangkan layar
   menampilkan nama berkasnya saja. */
function namaBerkas(jalur: string): string {
  return jalur.split('/').filter(Boolean).pop() ?? ''
}

export function TagihanPage() {
  const kontrak = useContracts()
  const tagihan = usePayments()
  const unggah = useUnggahBukti()
  const { tampilkan } = useToast()
  const [galat, setGalat] = useState('')
  const [berkas, setBerkas] = useState('')

  /* Tagihan diturunkan dari kontrak: bulan yang belum dibayar tidak punya baris
     pembayaran, jadi `usePayments()` saja tidak bisa menyusun daftar ini.
     `tanggalHariIni()` memakai tanggal kalender WIB — `toISOString()` (UTC)
     menyembunyikan tagihan bulan berjalan selama tujuh jam pertama tiap bulan. */
  const daftar = susunTagihan(kontrak.data ?? [], tagihan.data ?? [], tanggalHariIni())
  const belumBayar = daftar.filter((baris) => baris.status === 'Belum Bayar').length
  const galatMuat = kontrak.error ?? tagihan.error

  function kirim(masukan: MasukanUnggah) {
    setGalat('')
    setBerkas(masukan.proof.name)
    unggah.mutate(masukan, {
      onSuccess: () => {
        setBerkas('')
        tampilkan('Bukti bayar terkirim dan menunggu verifikasi pemilik.', 'success')
      },
      onError: (eror) => setGalat((eror as Error).message),
    })
  }

  function unggahBukti(baris: Tagihan, proof: File) {
    kirim({ contract_id: baris.contract_id, month: baris.month, amount: baris.amount, proof })
  }

  return (
    <section className="mx-auto max-w-container px-4 pb-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2 border-b border-brand-border pb-4">
        <div>
          <h1 className="text-heading-m font-bold text-brand-text">Tagihan &amp; Pembayaran</h1>
          <p className="mt-1 text-ui text-brand-text-muted">Unggah bukti bayar untuk tiap tagihan bulanan yang belum lunas.</p>
        </div>
        <span className="rounded-full bg-brand-warning-soft px-3 py-2 text-micro font-bold text-brand-warning-soft-fg">{belumBayar} Belum Dibayar</span>
      </div>

      {(kontrak.isPending || tagihan.isPending) && <Skeleton className="h-40 rounded-2xl" />}
      {galatMuat && <ErrorState message={(galatMuat as Error).message} onRetry={() => { kontrak.refetch(); tagihan.refetch() }} />}

      {kontrak.isSuccess && tagihan.isSuccess && (
        <div className="rounded-2xl border border-brand-border bg-brand-surface shadow-sm">
          <Tabel kolom={['Unit / Bulan', 'Jumlah', 'Status', 'Bukti Bayar', 'Tindakan']}>
            {daftar.map((baris) => (
              <tr key={baris.kunci}>
                <td className="p-4">
                  <span className="block font-bold text-brand-text">{baris.unit_title}</span>
                  <span className="text-micro text-brand-text-subtle">Tagihan {formatBulan(baris.month)}</span>
                </td>
                <td className="p-4 font-extrabold text-brand-accent">{formatRupiah(baris.amount)}</td>
                <td className="p-4"><StatusChip nilai={baris.status} /></td>
                <td className="p-4 text-brand-text-muted">{namaBerkas(baris.proof_url) || 'Belum ada berkas'}</td>
                <td className="p-4 text-right">
                  {(baris.status === 'Belum Bayar' || baris.status === 'Ditolak') && (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-accent-border bg-brand-accent-soft px-3 py-2 text-ui font-semibold text-brand-accent">
                      {baris.status === 'Ditolak' ? 'Unggah Ulang' : 'Unggah Bukti'}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const berkasTerpilih = e.target.files?.[0]
                          if (berkasTerpilih) unggahBukti(baris, berkasTerpilih)
                        }}
                      />
                    </label>
                  )}
                  {baris.status === 'Menunggu Verifikasi' && <span className="text-micro text-brand-text-subtle">Menunggu pemilik</span>}
                  {baris.status === 'Lunas' && <span className="text-micro font-semibold text-brand-success-soft-fg">Selesai</span>}
                </td>
              </tr>
            ))}
            {daftar.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-ui text-brand-text-muted">Belum ada tagihan bulan ini.</td>
              </tr>
            )}
          </Tabel>
        </div>
      )}

      {(galat || unggah.isPending || berkas) && (
        <div role="status" className="mt-3 space-y-2 rounded-2xl border border-brand-border bg-brand-surface p-4">
          {unggah.isPending && <p className="text-ui text-brand-text-muted">Mengunggah {berkas}…</p>}
          {galat && (
            <div className="space-y-2">
              <p className="text-ui text-brand-danger-soft-fg">{galat}</p>
              <button type="button" onClick={() => { if (unggah.variables) kirim(unggah.variables) }} className="rounded-lg bg-brand-danger px-3 py-1.5 text-micro font-semibold text-brand-danger-fg">
                Coba Lagi
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
