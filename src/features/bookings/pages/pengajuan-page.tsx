import { useBookings, useUbahStatusPengajuan } from '@/features/bookings/api'
import { EmptyState } from '@/ui/empty-state'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'
import { StatusChip } from '@/ui/status-chip'
import { Tabel } from '@/ui/tabel'
import { useKonfirmasi } from '@/ui/confirm-dialog'
import { useToast } from '@/ui/toast'

export function PengajuanPage() {
  const pengajuan = useBookings()
  const ubah = useUbahStatusPengajuan()
  const konfirmasi = useKonfirmasi()
  const { tampilkan } = useToast()

  const daftar = pengajuan.data ?? []
  const perluRespon = daftar.filter((baris) => baris.status === 'Menunggu Persetujuan').length

  function terima(id: number, nama: string) {
    ubah.mutate(
      { id, status: 'Disetujui' },
      {
        onSuccess: () => tampilkan(`Pengajuan ${nama} diterima.`, 'success'),
        onError: (galat) => tampilkan((galat as Error).message, 'danger'),
      },
    )
  }

  async function tolak(id: number, nama: string) {
    const setuju = await konfirmasi({
      judul: 'Tolak pengajuan ini?',
      pesan: `Calon penyewa ${nama} akan menerima kabar penolakan.`,
      labelKonfirmasi: 'Tolak pengajuan',
    })
    if (!setuju) return
    ubah.mutate(
      { id, status: 'Ditolak' },
      {
        onSuccess: () => tampilkan(`Pengajuan ${nama} ditolak.`, 'warning'),
        onError: (galat) => tampilkan((galat as Error).message, 'danger'),
      },
    )
  }

  return (
    <section className="mx-auto max-w-container space-y-4 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-3">
        <div>
          <h1 className="text-heading-m font-bold text-brand-text">Pengajuan Sewa &amp; Transaksi Masuk</h1>
          <p className="text-micro text-brand-text-muted">Daftar calon penyewa yang mengajukan reservasi unit Anda.</p>
        </div>
        <span className="rounded-full bg-brand-warning-soft px-3 py-1 text-micro font-bold text-brand-warning-soft-fg">{perluRespon} Perlu Respon</span>
      </div>

      {pengajuan.isPending && <Skeleton className="h-40" />}
      {pengajuan.isError && <ErrorState message={(pengajuan.error as Error).message} onRetry={() => pengajuan.refetch()} />}
      {pengajuan.isSuccess && daftar.length === 0 && <EmptyState title="Belum ada pengajuan" description="Pengajuan dari calon penyewa akan tampil di sini." />}

      {pengajuan.isSuccess && daftar.length > 0 && (
        <div className="rounded-2xl border border-brand-border bg-brand-surface shadow-sm">
          <Tabel kolom={['Calon Penyewa', 'Unit Yang Diajukan', 'Kontak WhatsApp', 'Durasi / Tanggal', 'Status Pengajuan', 'Tindakan']}>
            {daftar.map((baris) => (
              <tr key={baris.id}>
                <td className="p-3 font-bold text-brand-text">{baris.renter_name}</td>
                <td className="p-3 font-medium text-brand-text">{baris.unit_title}</td>
                <td className="p-3 font-mono text-brand-success">
                  <a href={`https://wa.me/${baris.renter_phone}`} target="_blank" rel="noreferrer">{baris.renter_phone}</a>
                </td>
                <td className="p-3 text-brand-text-muted">{baris.duration}</td>
                <td className="p-3"><StatusChip nilai={baris.status} /></td>
                <td className="p-3 text-right">
                  {baris.status === 'Menunggu Persetujuan' ? (
                    <span className="inline-flex gap-1">
                      <button type="button" onClick={() => terima(baris.id, baris.renter_name)} disabled={ubah.isPending} className="rounded bg-brand-success px-3 py-1 text-micro font-semibold text-brand-success-fg">
                        Terima
                      </button>
                      <button type="button" onClick={() => tolak(baris.id, baris.renter_name)} disabled={ubah.isPending} className="rounded bg-brand-danger px-3 py-1 text-micro font-semibold text-brand-danger-fg">
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
        </div>
      )}
    </section>
  )
}
