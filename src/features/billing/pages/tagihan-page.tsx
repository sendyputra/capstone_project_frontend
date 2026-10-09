import { useState } from 'react'
import { usePayments, useUnggahBukti } from '@/features/billing/api'
import { formatRupiah } from '@/lib/format'
import { StatusChip } from '@/ui/status-chip'
import { Tabel } from '@/ui/tabel'
import { useToast } from '@/ui/toast'

export function TagihanPage() {
  const tagihan = usePayments()
  const unggah = useUnggahBukti()
  const { tampilkan } = useToast()
  const [galat, setGalat] = useState('')
  const [berkas, setBerkas] = useState('')

  const daftar = tagihan.data ?? []
  const belumBayar = daftar.filter((baris) => baris.status === 'Belum Bayar').length

  function unggahBukti(id: number, nama: string) {
    setGalat('')
    setBerkas(nama)
    unggah.mutate(
      { id, proof_url: nama },
      {
        onSuccess: () => {
          setBerkas('')
          tampilkan('Bukti bayar terkirim dan menunggu verifikasi admin.', 'success')
        },
        onError: (eror) => setGalat((eror as Error).message),
      },
    )
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

      <div className="rounded-2xl border border-brand-border bg-brand-surface shadow-sm">
        <Tabel kolom={['Unit / Bulan', 'Jumlah', 'Status', 'Bukti Bayar', 'Tindakan']}>
          {daftar.map((baris) => (
            <tr key={baris.id}>
              <td className="p-4">
                <span className="block font-bold text-brand-text">{baris.unit_title}</span>
                <span className="text-micro text-brand-text-subtle">Tagihan {baris.month}</span>
              </td>
              <td className="p-4 font-extrabold text-brand-accent">{formatRupiah(baris.amount)}</td>
              <td className="p-4"><StatusChip nilai={baris.status} /></td>
              <td className="p-4 text-brand-text-muted">{baris.proof_url || 'Belum ada berkas'}</td>
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
                        if (berkasTerpilih) unggahBukti(baris.id, berkasTerpilih.name)
                      }}
                    />
                  </label>
                )}
                {baris.status === 'Menunggu Verifikasi' && <span className="text-micro text-brand-text-subtle">Menunggu admin</span>}
                {baris.status === 'Lunas' && <span className="text-micro font-semibold text-brand-success-soft-fg">Selesai</span>}
              </td>
            </tr>
          ))}
        </Tabel>
      </div>

      {(galat || unggah.isPending || berkas) && (
        <div role="status" className="mt-3 space-y-2 rounded-2xl border border-brand-border bg-brand-surface p-4">
          {unggah.isPending && <p className="text-ui text-brand-text-muted">Mengunggah {berkas}…</p>}
          {galat && (
            <div className="space-y-2">
              <p className="text-ui text-brand-danger-soft-fg">{galat}</p>
              <button type="button" onClick={() => unggahBukti(unggah.variables?.id ?? 0, unggah.variables?.proof_url ?? berkas)} className="rounded-lg bg-brand-danger px-3 py-1.5 text-micro font-semibold text-brand-danger-fg">
                Coba Lagi
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
