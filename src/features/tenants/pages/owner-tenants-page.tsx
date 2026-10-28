import { useState, type FormEvent } from 'react'
import type { KtpStatus, TenantRow } from '@/api/types'
import { useBuatTenant, useHapusTenant, useTenants, useUbahTenant } from '@/features/tenants/api'
import { useKonfirmasi } from '@/ui/confirm-dialog'
import { EmptyState } from '@/ui/empty-state'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'
import { Tabel } from '@/ui/tabel'
import { useToast } from '@/ui/toast'

const PILIHAN_KTP: KtpStatus[] = ['Belum', 'Menunggu', 'Terverifikasi']

export function OwnerTenantsPage() {
  const daftar = useTenants()
  const buat = useBuatTenant()
  const ubah = useUbahTenant()
  const hapus = useHapusTenant()
  const konfirmasi = useKonfirmasi()
  const { tampilkan } = useToast()
  const [sunting, setSunting] = useState<TenantRow | null>(null)
  const [nama, setNama] = useState('')
  const [telepon, setTelepon] = useState('')
  const [ktp, setKtp] = useState<KtpStatus>('Belum')
  const [galat, setGalat] = useState('')

  function kosongkan() {
    setSunting(null)
    setNama('')
    setTelepon('')
    setKtp('Belum')
    setGalat('')
  }

  function mulaiUbah(penyewa: TenantRow) {
    setSunting(penyewa)
    setNama(penyewa.name)
    setTelepon(penyewa.phone)
    setKtp(penyewa.ktp)
    setGalat('')
  }

  function simpan(peristiwa: FormEvent) {
    peristiwa.preventDefault()
    if (!nama.trim()) {
      setGalat('Nama penyewa wajib diisi.')
      return
    }
    setGalat('')
    const masukan = { name: nama.trim(), phone: telepon.trim(), ktp }
    const selesai = {
      onSuccess: () => {
        kosongkan()
        tampilkan(sunting ? 'Penyewa diperbarui.' : 'Penyewa ditambahkan.', 'success')
      },
      onError: (eror: unknown) => setGalat((eror as Error).message),
    }
    if (sunting) ubah.mutate({ id: sunting.id, ...masukan }, selesai)
    else buat.mutate(masukan, selesai)
  }

  async function mintaHapus(penyewa: TenantRow) {
    const setuju = await konfirmasi({
      judul: 'Hapus penyewa ini?',
      pesan: `${penyewa.name} akan dihapus dari daftar penyewa Anda.`,
      labelKonfirmasi: 'Hapus penyewa',
    })
    if (!setuju) return
    hapus.mutate(penyewa.id, {
      onSuccess: () => tampilkan('Penyewa dihapus.', 'success'),
      onError: (eror) => setGalat((eror as Error).message),
    })
  }

  return (
    <section className="mx-auto max-w-container space-y-6 px-4 py-8">
      <div className="border-b border-brand-border pb-4">
        <h1 className="text-heading-m font-bold text-brand-text">Penyewa</h1>
        <p className="text-micro text-brand-text-muted">Penyewa buatan Anda dan penyewa yang punya kontrak pada unit Anda.</p>
      </div>

      {galat && (
        <p role="alert" className="rounded-xl border border-brand-danger-border bg-brand-danger-soft p-3 text-ui text-brand-danger-soft-fg">
          {galat}
        </p>
      )}

      <form onSubmit={simpan} aria-label="Form penyewa" className="grid gap-3 rounded-xl border border-brand-border bg-brand-surface p-4 sm:grid-cols-4">
        <label className="block text-ui font-semibold text-brand-text">
          Nama
          <input value={nama} onChange={(e) => setNama(e.target.value)} className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2" />
        </label>
        <label className="block text-ui font-semibold text-brand-text">
          Telepon
          <input value={telepon} onChange={(e) => setTelepon(e.target.value)} className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2" />
        </label>
        <label className="block text-ui font-semibold text-brand-text">
          KTP
          <select value={ktp} onChange={(e) => setKtp(e.target.value as KtpStatus)} className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2">
            {PILIHAN_KTP.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={buat.isPending || ubah.isPending}
            className="rounded-lg bg-brand-accent px-4 py-2 text-ui font-semibold text-brand-accent-fg disabled:opacity-70"
          >
            {buat.isPending || ubah.isPending ? 'Menyimpan…' : 'Simpan Penyewa'}
          </button>
          {sunting && (
            <button type="button" onClick={kosongkan} className="rounded-lg border border-brand-border px-4 py-2 text-ui font-semibold text-brand-text">
              Batal
            </button>
          )}
        </div>
      </form>

      {daftar.isPending && <Skeleton className="h-40" />}
      {daftar.isError && <ErrorState message={(daftar.error as Error).message} onRetry={() => daftar.refetch()} />}
      {daftar.isSuccess && daftar.data.length === 0 && (
        <EmptyState title="Belum ada penyewa" description="Tambahkan penyewa tanpa akun supaya bisa dibuatkan kontrak." />
      )}
      {daftar.isSuccess && daftar.data.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-brand-border">
          <Tabel kolom={['Nama', 'Telepon', 'KTP', 'Jumlah Kontrak', 'Aksi']}>
            {daftar.data.map((penyewa) => (
              <tr key={penyewa.id}>
                <td className="p-4 font-semibold">{penyewa.name}</td>
                <td className="p-4">{penyewa.phone || '—'}</td>
                <td className="p-4">{penyewa.ktp}</td>
                <td className="p-4">{penyewa.contracts_count}</td>
                <td className="flex gap-2 p-4">
                  <button type="button" onClick={() => mulaiUbah(penyewa)} className="font-semibold text-brand-accent">
                    Ubah
                  </button>
                  {/* Penyewa yang sudah punya kontrak tidak boleh dihapus: backend
                      menolak, jadi tombolnya tidak ditawarkan. */}
                  {penyewa.contracts_count === 0 && (
                    <button type="button" onClick={() => mintaHapus(penyewa)} className="font-semibold text-brand-danger">
                      Hapus
                    </button>
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
