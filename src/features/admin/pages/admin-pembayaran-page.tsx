import { usePayments, useVerifikasiPembayaran } from '@/features/billing/api'
import { formatRupiah } from '@/lib/format'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'
import { StatusChip } from '@/ui/status-chip'
import { Tabel } from '@/ui/tabel'
import { useKonfirmasi } from '@/ui/confirm-dialog'
import { useToast } from '@/ui/toast'

export function AdminPembayaranPage() {
  const tagihan = usePayments()
  const verifikasi = useVerifikasiPembayaran()
  const konfirmasi = useKonfirmasi()
  const { tampilkan } = useToast()
  const daftar = tagihan.data ?? []
  const menunggu = daftar.filter((baris) => baris.status === 'Menunggu Verifikasi').length

  function setujui(id: number, nama: string, bulan: string) {
    verifikasi.mutate(
      { id, status: 'Lunas' },
      {
        onSuccess: () => tampilkan(`Bukti bayar ${nama} diterima. Tagihan ${bulan} ditandai lunas.`, 'success'),
        onError: (galat) => tampilkan((galat as Error).message, 'danger'),
      },
    )
  }

  async function tolak(id: number, bulan: string) {
    const setuju = await konfirmasi({
      judul: 'Tolak bukti bayar ini?',
      pesan: `Penyewa akan diminta mengunggah ulang bukti untuk tagihan ${bulan}.`,
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

  return (
    <section className="space-y-6 rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-4">
        <div>
          <h2 className="text-heading-s font-bold text-brand-text">Verifikasi Pembayaran</h2>
          <p className="text-micro text-brand-text-muted">Bukti bayar yang diunggah penyewa, menunggu setujui atau tolak.</p>
        </div>
        <span className="rounded-full bg-brand-warning-soft px-3 py-2 text-micro font-bold text-brand-warning-soft-fg">{menunggu} Menunggu</span>
      </div>

      {tagihan.isPending && <Skeleton className="h-40" />}
      {tagihan.isError && <ErrorState message={(tagihan.error as Error).message} onRetry={() => tagihan.refetch()} />}
      {tagihan.isSuccess && (
        <Tabel kolom={['Penyewa', 'Unit / Bulan', 'Jumlah', 'Bukti Bayar', 'Status', 'Aksi']}>
          {daftar.map((baris) => (
            <tr key={baris.id}>
              <td className="p-4 font-bold text-brand-text">{baris.renter_name}</td>
              <td className="p-4">
                <span className="block font-semibold text-brand-text">{baris.unit_title}</span>
                <span className="text-micro text-brand-text-subtle">Tagihan {baris.month}</span>
              </td>
              <td className="p-4 font-extrabold text-brand-accent">{formatRupiah(baris.amount)}</td>
              <td className="p-4 text-brand-text-muted">{baris.proof_url || 'Belum ada berkas'}</td>
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
