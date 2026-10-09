import type { Role } from '@/api/types'
import { useHapusPengguna, useUbahPeranPengguna, useUsers } from '@/features/admin/api'
import { inisial } from '@/lib/format'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'
import { Tabel } from '@/ui/tabel'
import { useKonfirmasi } from '@/ui/confirm-dialog'
import { useToast } from '@/ui/toast'

const LABEL_PERAN: Record<Role, string> = { penyewa: 'Penyewa', pemilik: 'Pemilik', admin: 'Admin' }

export function AdminPenggunaPage() {
  const pengguna = useUsers()
  const ubahPeran = useUbahPeranPengguna()
  const hapus = useHapusPengguna()
  const konfirmasi = useKonfirmasi()
  const { tampilkan } = useToast()
  const daftar = pengguna.data ?? []

  function gantiPeran(id: number, nama: string, role: Role) {
    ubahPeran.mutate(
      { id, role },
      {
        onSuccess: () => tampilkan(`Peran ${nama} diubah menjadi ${LABEL_PERAN[role]}.`, 'info'),
        onError: (galat) => tampilkan((galat as Error).message, 'danger'),
      },
    )
  }

  async function mintaHapus(id: number, nama: string) {
    const setuju = await konfirmasi({
      judul: 'Hapus akun ini?',
      pesan: `Akun ${nama} beserta kontrak dan tagihannya tidak dapat dikembalikan.`,
      labelKonfirmasi: 'Hapus akun',
    })
    if (!setuju) return
    hapus.mutate(id, {
      onSuccess: () => tampilkan(`Akun ${nama} dihapus.`, 'success'),
      onError: (galat) => tampilkan((galat as Error).message, 'danger'),
    })
  }

  return (
    <section className="space-y-6 rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-4">
        <div>
          <h2 className="text-heading-s font-bold text-brand-text">Kelola Pengguna</h2>
          <p className="text-micro text-brand-text-muted">Daftar akun, perubahan peran, dan penghapusan akun.</p>
        </div>
      </div>

      {pengguna.isPending && <Skeleton className="h-40" />}
      {pengguna.isError && <ErrorState message={(pengguna.error as Error).message} onRetry={() => pengguna.refetch()} />}
      {pengguna.isSuccess && (
        <Tabel kolom={['Pengguna', 'Kontak', 'Peran', 'Terdaftar', 'Aksi']}>
          {daftar.map((baris) => (
            <tr key={baris.id}>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-accent-track text-micro font-bold text-brand-accent-soft-fg">
                    {inisial(baris.name)}
                  </span>
                  <div>
                    <span className="block font-bold text-brand-text">{baris.name}</span>
                    <span className="text-micro text-brand-text-subtle">{baris.city || 'Tanpa kota'}</span>
                  </div>
                </div>
              </td>
              <td className="p-4 text-brand-text-muted">
                <span className="block">{baris.email}</span>
                <span className="text-micro text-brand-text-subtle">{baris.phone || 'Tanpa nomor'}</span>
              </td>
              <td className="p-4">
                <select
                  aria-label={`Peran ${baris.name}`}
                  value={baris.role}
                  onChange={(e) => gantiPeran(baris.id, baris.name, e.target.value as Role)}
                  className="rounded-lg border border-brand-border bg-brand-bg px-2 py-1.5 text-micro font-semibold text-brand-text"
                >
                  <option value="penyewa">Penyewa</option>
                  <option value="pemilik">Pemilik</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="p-4 text-brand-text-muted">{baris.joined}</td>
              <td className="p-4 text-right">
                {baris.id === 401 ? (
                  <span className="text-micro text-brand-text-subtle">Tidak dapat dihapus</span>
                ) : (
                  <button type="button" onClick={() => mintaHapus(baris.id, baris.name)} aria-label={`Hapus akun ${baris.name}`} className="rounded-lg bg-brand-danger-soft px-3 py-1 text-micro font-semibold text-brand-danger">
                    Hapus akun
                  </button>
                )}
              </td>
            </tr>
          ))}
        </Tabel>
      )}
    </section>
  )
}
