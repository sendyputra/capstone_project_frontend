import { useContracts, useUbahStatusKontrak } from '@/features/contracts/api'
import { formatRupiah, formatTanggal } from '@/lib/format'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'
import { StatusChip } from '@/ui/status-chip'
import { Tabel } from '@/ui/tabel'
import { useToast } from '@/ui/toast'

export function AdminKontrakPage() {
  const kontrak = useContracts()
  const ubah = useUbahStatusKontrak()
  const { tampilkan } = useToast()
  const daftar = kontrak.data ?? []
  const aktif = daftar.filter((baris) => baris.status === 'Aktif').length

  function tandai(id: number, status: 'Selesai' | 'Dibatalkan', nama: string) {
    ubah.mutate(
      { id, status },
      {
        onSuccess: () => tampilkan(`Kontrak ${nama} ditandai ${status.toLowerCase()}.`, status === 'Selesai' ? 'success' : 'danger'),
        onError: (galat) => tampilkan((galat as Error).message, 'danger'),
      },
    )
  }

  return (
    <section className="space-y-6 rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-4">
        <div>
          <h2 className="text-heading-s font-bold text-brand-text">Kelola Kontrak Sewa</h2>
          <p className="text-micro text-brand-text-muted">Daftar kontrak berjalan beserta perubahan statusnya.</p>
        </div>
        <span className="rounded-full bg-brand-success-soft px-3 py-2 text-micro font-bold text-brand-success-soft-fg">{aktif} Aktif</span>
      </div>

      {kontrak.isPending && <Skeleton className="h-40" />}
      {kontrak.isError && <ErrorState message={(kontrak.error as Error).message} onRetry={() => kontrak.refetch()} />}
      {kontrak.isSuccess && (
        <Tabel kolom={['Penyewa', 'Unit & Pemilik', 'Masa Sewa', 'Nilai Kontrak', 'Status Kontrak', 'Aksi']}>
          {daftar.map((baris) => (
            <tr key={baris.id}>
              <td className="p-4 font-bold text-brand-text">{baris.renter_name}</td>
              <td className="p-4">
                <span className="block font-semibold text-brand-text">{baris.unit_title}</span>
                <span className="text-micro text-brand-text-subtle">{baris.owner_name}</span>
              </td>
              <td className="p-4 text-brand-text-muted">
                <span className="block">{formatTanggal(baris.start_date)} – {formatTanggal(baris.end_date)}</span>
                <span className="text-micro text-brand-text-subtle">{baris.term}</span>
              </td>
              <td className="p-4 font-extrabold text-brand-accent">{formatRupiah(baris.monthly)} / bln</td>
              <td className="p-4"><StatusChip nilai={baris.status} /></td>
              <td className="p-4 text-right">
                {baris.status === 'Aktif' ? (
                  <span className="inline-flex gap-1">
                    <button type="button" disabled={ubah.isPending} onClick={() => tandai(baris.id, 'Selesai', baris.renter_name)} className="rounded bg-brand-success px-3 py-1 text-micro font-semibold text-brand-success-fg">
                      Selesaikan
                    </button>
                    <button type="button" disabled={ubah.isPending} onClick={() => tandai(baris.id, 'Dibatalkan', baris.renter_name)} className="rounded bg-brand-danger px-3 py-1 text-micro font-semibold text-brand-danger-fg">
                      Batalkan
                    </button>
                  </span>
                ) : (
                  <span className="text-micro text-brand-text-subtle">Tidak ada tindakan</span>
                )}
              </td>
            </tr>
          ))}
        </Tabel>
      )}
    </section>
  )
}
