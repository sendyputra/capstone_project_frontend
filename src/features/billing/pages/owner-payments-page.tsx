import { useState, type FormEvent } from 'react'
import { useCatatPembayaran, usePayments, useUnduhLaporanTagihan, useVerifikasiPembayaran } from '@/features/billing/api'
import { useContracts } from '@/features/contracts/api'
import { formatBulan, formatRupiah, namaBerkas } from '@/lib/format'
import { susunTagihan, urutkanTagihan } from '@/lib/tagihan'
import { tanggalHariIni } from '@/lib/tanggal'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'
import { StatusChip } from '@/ui/status-chip'
import { Tabel } from '@/ui/tabel'
import { useKonfirmasi } from '@/ui/confirm-dialog'
import { useToast } from '@/ui/toast'

export function OwnerPaymentsPage() {
  const tagihan = usePayments()
  const verifikasi = useVerifikasiPembayaran()
  const unduhLaporan = useUnduhLaporanTagihan()
  const konfirmasi = useKonfirmasi()
  const catat = useCatatPembayaran()
  const kontrak = useContracts()
  const { tampilkan } = useToast()
  /* Backend mengirim pembayaran urut `created_at`; tabel menyusunnya per
     kontrak dengan bulan terbaru dulu supaya bulan tidak melompat-lompat. */
  const daftar = urutkanTagihan(tagihan.data ?? [])
  const menunggu = daftar.filter((baris) => baris.status === 'Menunggu Verifikasi').length
  const [bukaForm, setBukaForm] = useState(false)
  const [kontrakId, setKontrakId] = useState('')
  const [bulan, setBulan] = useState('')
  const [jumlah, setJumlah] = useState(0)
  const [galatForm, setGalatForm] = useState('')

  const kontrakAktif = (kontrak.data ?? []).filter((baris) => baris.status === 'Aktif')
  const kontrakDipilih = kontrakAktif.find((baris) => baris.id === Number(kontrakId))
  /* Hanya bulan tanpa pembayaran lunas/menunggu yang bisa dicatat ulang;
     `Ditolak` boleh diisi manual karena bukti lamanya sudah tidak berlaku. */
  const bulanTersedia = kontrakDipilih
    ? susunTagihan([kontrakDipilih], daftar, tanggalHariIni()).filter(
        (baris) => baris.status === 'Belum Bayar' || baris.status === 'Ditolak',
      )
    : []

  function tutupForm() {
    setBukaForm(false)
    setKontrakId('')
    setBulan('')
    setJumlah(0)
    setGalatForm('')
  }

  function pilihKontrak(nilai: string) {
    setKontrakId(nilai)
    setGalatForm('')
    const dipilih = kontrakAktif.find((baris) => baris.id === Number(nilai))
    const tersedia = dipilih
      ? susunTagihan([dipilih], daftar, tanggalHariIni()).filter(
          (baris) => baris.status === 'Belum Bayar' || baris.status === 'Ditolak',
        )
      : []
    setBulan(tersedia[0]?.month ?? '')
    setJumlah(tersedia[0]?.amount ?? 0)
  }

  function pilihBulan(nilai: string) {
    setBulan(nilai)
    setJumlah(bulanTersedia.find((baris) => baris.month === nilai)?.amount ?? 0)
  }

  function simpanPembayaran(peristiwa: FormEvent) {
    peristiwa.preventDefault()
    if (!kontrakDipilih || !bulan) {
      setGalatForm('Kontrak dan bulan wajib dipilih.')
      return
    }
    catat.mutate(
      { contract_id: kontrakDipilih.id, month: bulan, amount: jumlah },
      {
        onSuccess: () => {
          const nama = kontrakDipilih.renter_name
          tutupForm()
          tampilkan(`Pembayaran ${nama} untuk ${formatBulan(bulan)} dicatat.`, 'success')
        },
        onError: (eror) => setGalatForm((eror as Error).message),
      },
    )
  }

  /* `month` datang dari API sebagai `YYYY-MM`; toast dan dialog memakai label
     bulan yang sama dengan kolom tabel, bukan nilai mentahnya. */
  function setujui(id: number, nama: string, bulan: string) {
    verifikasi.mutate(
      { id, status: 'Lunas' },
      {
        onSuccess: () => tampilkan(`Bukti bayar ${nama} diterima. Tagihan ${formatBulan(bulan)} ditandai lunas.`, 'success'),
        onError: (galat) => tampilkan((galat as Error).message, 'danger'),
      },
    )
  }

  async function tolak(id: number, bulan: string) {
    const setuju = await konfirmasi({
      judul: 'Tolak bukti bayar ini?',
      pesan: `Penyewa akan diminta mengunggah ulang bukti untuk tagihan ${formatBulan(bulan)}.`,
      labelKonfirmasi: 'Tolak bukti',
    })
    if (!setuju) return
    verifikasi.mutate(
      { id, status: 'Ditolak' },
      {
        onSuccess: () => tampilkan('Bukti bayar ditolak. Penyewa diminta mengunggah ulang.', 'warning'),
        onError: (galat) => tampilkan((galat as Error).message, 'danger'),
      },
    )
  }

  function unduh() {
    unduhLaporan.mutate(undefined, {
      onSuccess: () => tampilkan('Laporan tagihan diunduh.', 'success'),
      onError: (galat) => tampilkan((galat as Error).message, 'danger'),
    })
  }

  return (
    <section className="space-y-6 rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-4">
        <div>
          <h2 className="text-heading-s font-bold text-brand-text">Verifikasi Pembayaran Unit Saya</h2>
          <p className="text-micro text-brand-text-muted">Bukti bayar yang diunggah penyewa, menunggu setujui atau tolak.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={unduhLaporan.isPending}
            onClick={unduh}
            className="rounded-lg border border-brand-border px-3 py-2 text-micro font-bold text-brand-text-muted disabled:opacity-60"
          >
            {unduhLaporan.isPending ? 'Mengunduh…' : 'Unduh CSV'}
          </button>
          {/* Tanpa daftar tagihan yang terbaca, bulan yang sudah lunas tampak
              "Belum Bayar" dan formulir ini mencatat tagihan ganda. */}
          <button
            type="button"
            disabled={!tagihan.isSuccess}
            onClick={() => (bukaForm ? tutupForm() : setBukaForm(true))}
            className="rounded-lg bg-brand-accent px-3 py-2 text-micro font-bold text-brand-accent-fg disabled:opacity-60"
          >
            {bukaForm ? 'Tutup' : 'Catat Pembayaran'}
          </button>
          <span className="rounded-full bg-brand-warning-soft px-3 py-2 text-micro font-bold text-brand-warning-soft-fg">{menunggu} Menunggu</span>
        </div>
      </div>

      {bukaForm && (
        <form onSubmit={simpanPembayaran} aria-label="Form catat pembayaran" className="grid gap-3 rounded-xl border border-brand-border bg-brand-bg p-4 sm:grid-cols-4">
          <label className="block text-ui font-semibold text-brand-text">
            Kontrak
            <select
              value={kontrakId}
              onChange={(e) => pilihKontrak(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2"
            >
              <option value="">Pilih kontrak</option>
              {kontrakAktif.map((baris) => (
                <option key={baris.id} value={baris.id}>{baris.renter_name} — {baris.unit_title}</option>
              ))}
            </select>
          </label>
          <label className="block text-ui font-semibold text-brand-text">
            Bulan
            <select
              value={bulan}
              onChange={(e) => pilihBulan(e.target.value)}
              disabled={bulanTersedia.length === 0}
              className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 disabled:opacity-60"
            >
              {bulanTersedia.map((baris) => (
                <option key={baris.kunci} value={baris.month}>{formatBulan(baris.month)}</option>
              ))}
            </select>
          </label>
          <label className="block text-ui font-semibold text-brand-text">
            Jumlah
            <input
              type="number"
              min={1}
              value={jumlah}
              onChange={(e) => setJumlah(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={catat.isPending || bulanTersedia.length === 0}
              className="w-full rounded-lg bg-brand-accent px-4 py-2 text-ui font-semibold text-brand-accent-fg disabled:opacity-70"
            >
              {catat.isPending ? 'Menyimpan…' : 'Simpan Pembayaran'}
            </button>
          </div>
          {kontrakDipilih && bulanTersedia.length === 0 && (
            <p className="sm:col-span-4 text-micro text-brand-text-muted">Semua bulan sudah dibayar.</p>
          )}
          {galatForm && (
            <p role="alert" className="sm:col-span-4 rounded-lg border border-brand-danger-border bg-brand-danger-soft p-3 text-ui text-brand-danger-soft-fg">
              {galatForm}
            </p>
          )}
        </form>
      )}

      {tagihan.isPending && <Skeleton className="h-40" />}
      {tagihan.isError && <ErrorState message={(tagihan.error as Error).message} onRetry={() => tagihan.refetch()} />}
      {tagihan.isSuccess && (
        <Tabel kolom={['Penyewa', 'Unit / Bulan', 'Jumlah', 'Bukti Bayar', 'Status', 'Aksi']} kolomAkhirKanan>
          {daftar.map((baris) => (
            <tr key={baris.id}>
              <td className="p-4 font-bold text-brand-text">{baris.renter_name}</td>
              <td className="p-4">
                <span className="block font-semibold text-brand-text">{baris.unit_title}</span>
                <span className="text-micro text-brand-text-subtle">Tagihan {formatBulan(baris.month)}</span>
              </td>
              <td className="p-4 font-extrabold text-brand-accent">{formatRupiah(baris.amount)}</td>
              {/* `proof_url` berisi jalur berkas dari API; layar menampilkan
                  namanya saja, sama seperti layar tagihan penyewa. */}
              <td className="p-4 text-brand-text-muted">{namaBerkas(baris.proof_url) || 'Belum ada berkas'}</td>
              <td className="p-4"><StatusChip nilai={baris.status} /></td>
              <td className="p-4 text-right">
                {baris.status === 'Menunggu Verifikasi' ? (
                  <span className="inline-flex gap-1">
                    <button type="button" disabled={verifikasi.isPending} onClick={() => setujui(baris.id, baris.renter_name, baris.month)} className="rounded bg-brand-success px-3 py-1 text-micro font-semibold text-brand-success-fg">
                      Setujui
                    </button>
                    <button type="button" disabled={verifikasi.isPending} onClick={() => tolak(baris.id, baris.month)} className="rounded bg-brand-danger px-3 py-1 text-micro font-semibold text-brand-danger-fg">
                      Tolak
                    </button>
                  </span>
                ) : (
                  <span className="text-micro text-brand-text-subtle">Selesai</span>
                )}
              </td>
            </tr>
          ))}
        </Tabel>
      )}
    </section>
  )
}
