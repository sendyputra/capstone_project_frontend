import { useState } from 'react'
import type { ContractRow } from '@/api/types'
import { usePayments, useUnduhLaporanTagihan, useUnggahBukti } from '@/features/billing/api'
import { useContracts } from '@/features/contracts/api'
import { formatBulan, formatRupiah, formatTanggalPendek, formatWaktu, namaBerkas } from '@/lib/format'
import { LABEL_ALASAN, labelStatusKontrak } from '@/lib/sewa'
import { kelompokkanSewa, susunTagihan, urutkanTagihan, type Tagihan } from '@/lib/tagihan'
import { tanggalHariIni } from '@/lib/tanggal'
import { ErrorState } from '@/ui/error-state'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'
import { StatusChip } from '@/ui/status-chip'
import { TabelSaring } from '@/ui/tabel-saring'
import { TautanBukti } from '@/features/billing/tautan-bukti'
import { useToast } from '@/ui/toast'

type MasukanUnggah = { contract_id: number; month: string; amount: number; proof: File }

/* Masa sewa ditulis pendek supaya muat satu baris kartu, dan tanggal tak
   terbaca menjadi "—" alih-alih "Invalid Date". */
function masaSewa(kontrak: ContractRow) {
  return `${formatTanggalPendek(kontrak.start_date)} – ${formatTanggalPendek(kontrak.end_date)}`
}

function KartuSewa({ kontrak, keterangan }: { kontrak: ContractRow; keterangan?: string }) {
  return (
    <li className="rounded-xl border border-brand-border bg-brand-bg px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-brand-text">{kontrak.unit_title}</span>
        <StatusChip nilai={labelStatusKontrak(kontrak)} />
      </div>
      <p className="mt-1 text-micro text-brand-text-muted">
        {masaSewa(kontrak)} · {formatRupiah(kontrak.monthly)} / bln
      </p>
      {keterangan && <p className="mt-1 text-micro text-brand-text-subtle">{keterangan}</p>}
    </li>
  )
}

export function TagihanPage() {
  const kontrak = useContracts()
  const tagihan = usePayments()
  const unggah = useUnggahBukti()
  const unduhLaporan = useUnduhLaporanTagihan()
  const { tampilkan } = useToast()
  const [galat, setGalat] = useState('')
  const [riwayatTerbuka, setRiwayatTerbuka] = useState(true)
  const [berkas, setBerkas] = useState('')

  /* Tagihan diturunkan dari kontrak: bulan yang belum dibayar tidak punya baris
     pembayaran, jadi `usePayments()` saja tidak bisa menyusun daftar ini.
     `tanggalHariIni()` memakai tanggal kalender WIB — `toISOString()` (UTC)
     menyembunyikan tagihan bulan berjalan selama tujuh jam pertama tiap bulan. */
  const hariIni = tanggalHariIni()
  const kelompok = kelompokkanSewa(kontrak.data ?? [], hariIni)
  /* Tabel berjalan hanya memuat sewa yang benar-benar masih berjalan. Kontrak
     `Aktif` yang tanggal selesainya sudah lewat masuk riwayat; tanpa pembagian
     ini bulan yang sama muncul di kedua tabel, satu salinan dengan tombol
     unggah bukti. */
  const daftar = urutkanTagihan(susunTagihan(kelompok.berjalan, tagihan.data ?? [], hariIni))
  /* Riwayat memakai penyusun yang sama dengan `semuaKontrak`, jadi aturan
     bulan dan biaya bulanan tidak punya salinan kedua. */
  const riwayat = urutkanTagihan(
    susunTagihan(kelompok.riwayat, tagihan.data ?? [], hariIni, { semuaKontrak: true }),
  )
  const belumBayar = daftar.filter((baris) => baris.status === 'Tagihan Belum Dibayar').length
  const galatMuat = kontrak.error ?? tagihan.error
  const tabBagian = [
    { kunci: 'pengajuan', label: 'Pengajuan', jumlah: kelompok.pengajuan.length },
    { kunci: 'berjalan', label: 'Sewa Berjalan', jumlah: kelompok.berjalan.length },
    { kunci: 'riwayat', label: 'Riwayat Sewa', jumlah: kelompok.riwayat.length },
  ] as const
  const [tab, setTab] = useState<(typeof tabBagian)[number]['kunci']>('pengajuan')

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
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-warning-soft px-3 py-2 text-micro font-bold text-brand-warning-soft-fg">{belumBayar} Belum Dibayar</span>
          <button
            type="button"
            disabled={unduhLaporan.isPending}
            onClick={() =>
              unduhLaporan.mutate(undefined, {
                onSuccess: () => tampilkan('Laporan tagihan diunduh.', 'success'),
                onError: (eror) => tampilkan((eror as Error).message, 'danger'),
              })
            }
            className="rounded-lg border border-brand-border px-3 py-2 text-micro font-bold text-brand-text-muted disabled:opacity-60"
          >
            {unduhLaporan.isPending ? 'Mengunduh…' : 'Unduh CSV'}
          </button>
        </div>
      </div>

      {(kontrak.isPending || tagihan.isPending) && <Skeleton className="h-40 rounded-2xl" />}
      {galatMuat && <ErrorState message={(galatMuat as Error).message} onRetry={() => { kontrak.refetch(); tagihan.refetch() }} />}

      {kontrak.isSuccess && tagihan.isSuccess && (
        <>
          <div role="tablist" aria-label="Bagian sewa" className="mb-4 flex flex-wrap gap-2 border-b border-brand-border pb-2">
            {tabBagian.map((t) => (
              <button
                key={t.kunci}
                type="button"
                role="tab"
                id={`tab-${t.kunci}`}
                aria-selected={tab === t.kunci}
                aria-controls={`panel-${t.kunci}`}
                onClick={() => setTab(t.kunci)}
                className={`rounded-lg px-3 py-2 text-micro font-bold ${
                  tab === t.kunci
                    ? 'bg-brand-accent-soft text-brand-accent'
                    : 'text-brand-text-muted hover:bg-brand-surface hover:text-brand-text'
                }`}
              >
                {t.label} <span className="tabular-nums">({t.jumlah})</span>
              </button>
            ))}
          </div>

          {tab === 'pengajuan' && (
            <div id="panel-pengajuan" role="tabpanel" aria-labelledby="tab-pengajuan">
              <section aria-label="Pengajuan sewa" className="space-y-3">
                {kelompok.pengajuan.length > 0 ? (
                  <ul className="space-y-2">
                    {kelompok.pengajuan.map((baris) => (
                      <KartuSewa key={baris.id} kontrak={baris} keterangan="Menunggu persetujuan pemilik." />
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="Tidak ada pengajuan sewa" description="Pengajuan sewa baru yang menunggu persetujuan pemilik akan tampil di sini." />
                )}
              </section>
            </div>
          )}

          {tab === 'berjalan' && (
            <div id="panel-berjalan" role="tabpanel" aria-labelledby="tab-berjalan">
              <section aria-label="Sewa berjalan" className="space-y-3">
                {kelompok.berjalan.length > 0 ? (
                  <ul className="space-y-2">
                    {kelompok.berjalan.map((baris) => (
                      <KartuSewa key={baris.id} kontrak={baris} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="Tidak ada sewa berjalan" description="Sewa yang sudah disetujui dan sedang berjalan akan tampil di sini." />
                )}

            <div className="rounded-2xl border border-brand-border bg-brand-surface shadow-sm">
              <TabelSaring
                kolom={['Unit', 'Bulan Tagihan', 'Jumlah', 'Status', 'Bukti Bayar', 'Diunggah', 'Tindakan']}
                baris={daftar}
                urut={{
                  banding: {
                    Unit: (a, b) => a.unit_title.localeCompare(b.unit_title),
                    'Bulan Tagihan': (a, b) => a.month.localeCompare(b.month),
                    Jumlah: (a, b) => a.amount - b.amount,
                    Status: (a, b) => a.status.localeCompare(b.status),
                    'Bukti Bayar': (a, b) => namaBerkas(a.proof_url).localeCompare(namaBerkas(b.proof_url)),
                    Diunggah: (a, b) => a.dibuat.localeCompare(b.dibuat),
                  },
                }}
                saringan={[
                  { nilai: (baris) => baris.unit_title },
                  { nilai: (baris) => formatBulan(baris.month) },
                  { nilai: (baris) => formatRupiah(baris.amount) },
                  { jenis: 'pilihan', nilai: (baris) => baris.status, pilihan: ['Tagihan Belum Dibayar', 'Menunggu Verifikasi', 'Lunas', 'Ditolak'] },
                  { nilai: (baris) => namaBerkas(baris.proof_url) },
                  { nilai: (baris) => formatWaktu(baris.dibuat) },
                ]}
                kolomAkhirKanan
                kosong="Belum ada tagihan bulan ini."
              >
                {(tampil) => tampil.map((baris) => (
                  <tr key={baris.kunci}>
                    <td className="p-4 font-bold text-brand-text">{baris.unit_title}</td>
                    <td className="p-4 text-brand-text-muted">{formatBulan(baris.month)}</td>
                    <td className="p-4 font-extrabold text-brand-accent">{formatRupiah(baris.amount)}</td>
                    <td className="p-4"><StatusChip nilai={baris.status} /></td>
                    <td className="p-4 text-brand-text-muted"><TautanBukti url={baris.proof_url} /></td>
                    <td className="p-4 text-brand-text-muted">{formatWaktu(baris.dibuat ?? '')}</td>
                    <td className="p-4 text-right">
                      {(baris.status === 'Tagihan Belum Dibayar' || baris.status === 'Ditolak') && (
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
              </TabelSaring>
            </div>
              </section>
            </div>
          )}

          {tab === 'riwayat' && (
            <div id="panel-riwayat" role="tabpanel" aria-labelledby="tab-riwayat">
              <section aria-label="Riwayat sewa" className="space-y-3">
                {kelompok.riwayat.length > 0 ? (
                  <>
                    {/* Riwayat sengaja tanpa tombol unggah: bulannya sudah lewat. Yang
                        disimpan adalah keadaannya, bukan kesempatan membayarnya lagi. */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-heading-s font-bold text-brand-text">Riwayat Sewa</h2>
                      <button
                        type="button"
                        aria-expanded={riwayatTerbuka}
                        onClick={() => setRiwayatTerbuka((lama) => !lama)}
                        className="rounded-lg border border-brand-border bg-brand-surface px-3 py-1.5 text-micro font-semibold text-brand-text"
                      >
                        {riwayatTerbuka ? 'Lipat riwayat' : 'Buka riwayat'}
                      </button>
                    </div>
                    {riwayatTerbuka && kelompok.riwayat.map((baris) => (
                <article key={baris.id} className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-brand-text">{baris.unit_title}</span>
                    <StatusChip nilai={labelStatusKontrak(baris)} />
                  </div>
                  <p className="mt-1 text-micro text-brand-text-muted">
                    {masaSewa(baris)} · {formatRupiah(baris.monthly)} / bln
                  </p>
                  {baris.status === 'Aktif' && (
                    <p className="mt-1 text-micro text-brand-text-subtle">Masa sewa berakhir, menunggu penutupan pemilik.</p>
                  )}
                  {baris.ended_at && (
                    <p className="mt-1 text-micro text-brand-text-subtle">
                      Berakhir {formatTanggalPendek(baris.ended_at)}
                      {baris.end_reason ? ` · ${LABEL_ALASAN[baris.end_reason]}` : ''}
                    </p>
                  )}
                  <ul className="mt-3 divide-y divide-brand-border">
                    {riwayat
                      .filter((tagihanBulan) => tagihanBulan.contract_id === baris.id)
                      .map((tagihanBulan) => (
                        <li key={tagihanBulan.kunci} className="flex flex-wrap items-center justify-between gap-2 py-2 text-ui">
                          <span className="text-brand-text-muted">{formatBulan(tagihanBulan.month)}</span>
                          <span className="font-semibold text-brand-accent">{formatRupiah(tagihanBulan.amount)}</span>
                          <StatusChip nilai={tagihanBulan.status} />
                        </li>
                      ))}
                  </ul>
                </article>
                  ))}
                  </>
                ) : (
                  <EmptyState title="Tidak ada riwayat sewa" description="Sewa yang sudah selesai atau berhenti akan tampil di sini." />
                )}
              </section>
            </div>
          )}
        </>
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
