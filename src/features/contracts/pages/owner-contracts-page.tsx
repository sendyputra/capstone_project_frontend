import { useState, type FormEvent } from 'react'
import type { ContractRow } from '@/api/types'
import { useBuatKontrak, useContracts, useUbahStatusKontrak, useUnduhLaporanKontrak } from '@/features/contracts/api'
import { useTenants } from '@/features/tenants/api'
import { useMyUnits } from '@/features/units/api'
import { formatRupiah, formatTanggal } from '@/lib/format'
import { hitungSewa } from '@/lib/sewa'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'
import { StatusChip } from '@/ui/status-chip'
import { Tabel } from '@/ui/tabel'
import { useToast } from '@/ui/toast'

/* Spec §5: kontrak `Menunggu` tampil lebih dulu supaya pemilik melihat
   pekerjaannya sebelum daftar berjalan. Hanya kelompok itu yang dipindah —
   urutan sisanya dipertahankan apa adanya dari server (tanpa mengurutkan ulang
   berdasarkan status lain). */
function urutkanMenungguDulu(daftar: ContractRow[]): ContractRow[] {
  return [...daftar.filter((baris) => baris.status === 'Menunggu'), ...daftar.filter((baris) => baris.status !== 'Menunggu')]
}

export function OwnerContractsPage() {
  const kontrak = useContracts()
  const ubah = useUbahStatusKontrak()
  const unduhLaporan = useUnduhLaporanKontrak()
  const buat = useBuatKontrak()
  const penyewa = useTenants()
  const unitSaya = useMyUnits()
  const { tampilkan } = useToast()
  const daftar = urutkanMenungguDulu(kontrak.data ?? [])
  const aktif = daftar.filter((baris) => baris.status === 'Aktif').length
  const [bukaForm, setBukaForm] = useState(false)
  const [penyewaId, setPenyewaId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [mulai, setMulai] = useState('')
  const [durasi, setDurasi] = useState(3)
  const [galatForm, setGalatForm] = useState('')

  /* Unit `Perawatan` tidak bisa disewakan, jadi tidak ditawarkan. */
  const unitPilihan = (unitSaya.data ?? []).filter((unit) => unit.status !== 'Perawatan')
  const unitDipilih = unitPilihan.find((unit) => unit.id === Number(unitId))
  const ringkasan = unitDipilih && mulai ? hitungSewa(mulai, durasi, unitDipilih.price) : null

  function tutupForm() {
    setBukaForm(false)
    setPenyewaId('')
    setUnitId('')
    setMulai('')
    setDurasi(3)
    setGalatForm('')
  }

  function simpanKontrak(peristiwa: FormEvent) {
    peristiwa.preventDefault()
    if (!penyewaId || !unitDipilih) {
      setGalatForm('Penyewa dan unit wajib dipilih.')
      return
    }
    if (!mulai) {
      setGalatForm('Tanggal mulai sewa wajib diisi.')
      return
    }
    const { akhir, total } = hitungSewa(mulai, durasi, unitDipilih.price)
    const nama = (penyewa.data ?? []).find((baris) => baris.id === Number(penyewaId))?.name ?? 'penyewa'
    buat.mutate(
      { tenant_id: Number(penyewaId), unit_id: unitDipilih.id, start_date: mulai, end_date: akhir, total_price: total },
      {
        onSuccess: () => {
          tutupForm()
          tampilkan(`Kontrak ${nama} dibuat dan menunggu persetujuan.`, 'success')
        },
        onError: (eror) => setGalatForm((eror as Error).message),
      },
    )
  }

  function setujui(id: number, nama: string) {
    ubah.mutate(
      { id, status: 'Aktif' },
      {
        onSuccess: () => tampilkan(`Kontrak ${nama} diaktifkan.`, 'success'),
        onError: (galat) => tampilkan((galat as Error).message, 'danger'),
      },
    )
  }

  function tandai(id: number, status: 'Selesai' | 'Dibatalkan', nama: string) {
    ubah.mutate(
      { id, status },
      {
        onSuccess: () => tampilkan(`Kontrak ${nama} ditandai ${status.toLowerCase()}.`, status === 'Selesai' ? 'success' : 'danger'),
        onError: (galat) => tampilkan((galat as Error).message, 'danger'),
      },
    )
  }

  function unduh() {
    unduhLaporan.mutate(undefined, {
      onSuccess: () => tampilkan('Laporan kontrak diunduh.', 'success'),
      onError: (galat) => tampilkan((galat as Error).message, 'danger'),
    })
  }

  return (
    <section className="space-y-6 rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-4">
        <div>
          <h2 className="text-heading-s font-bold text-brand-text">Kontrak Sewa</h2>
          <p className="text-micro text-brand-text-muted">Daftar kontrak berjalan beserta perubahan statusnya.</p>
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
          <button
            type="button"
            onClick={() => (bukaForm ? tutupForm() : setBukaForm(true))}
            className="rounded-lg bg-brand-accent px-3 py-2 text-micro font-bold text-brand-accent-fg"
          >
            {bukaForm ? 'Tutup' : 'Buat Kontrak'}
          </button>
          <span className="rounded-full bg-brand-success-soft px-3 py-2 text-micro font-bold text-brand-success-soft-fg">{aktif} Aktif</span>
        </div>
      </div>

      {bukaForm && (
        <form onSubmit={simpanKontrak} aria-label="Form buat kontrak" className="grid gap-3 rounded-xl border border-brand-border bg-brand-bg p-4 sm:grid-cols-5">
          <label className="block text-ui font-semibold text-brand-text">
            Penyewa
            <select
              value={penyewaId}
              onChange={(e) => setPenyewaId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2"
            >
              <option value="">Pilih penyewa</option>
              {(penyewa.data ?? []).map((baris) => (
                <option key={baris.id} value={baris.id}>{baris.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-ui font-semibold text-brand-text">
            Unit
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2"
            >
              <option value="">Pilih unit</option>
              {unitPilihan.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-ui font-semibold text-brand-text">
            Mulai sewa
            <input
              type="date"
              value={mulai}
              onChange={(e) => setMulai(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2"
            />
          </label>
          <label className="block text-ui font-semibold text-brand-text">
            Durasi
            <select
              value={durasi}
              onChange={(e) => setDurasi(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2"
            >
              {[1, 3, 6, 12].map((bulan) => (
                <option key={bulan} value={bulan}>{bulan} bulan</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={buat.isPending}
              className="w-full rounded-lg bg-brand-accent px-4 py-2 text-ui font-semibold text-brand-accent-fg disabled:opacity-70"
            >
              {buat.isPending ? 'Menyimpan…' : 'Simpan Kontrak'}
            </button>
          </div>
          {galatForm && (
            <p role="alert" className="sm:col-span-5 rounded-lg border border-brand-danger-border bg-brand-danger-soft p-3 text-ui text-brand-danger-soft-fg">
              {galatForm}
            </p>
          )}
          {ringkasan && (
            <p className="sm:col-span-5 text-micro text-brand-text-muted">
              Selesai {formatTanggal(ringkasan.akhir)} · Total {formatRupiah(ringkasan.total)}
            </p>
          )}
        </form>
      )}

      {kontrak.isPending && <Skeleton className="h-40" />}
      {kontrak.isError && <ErrorState message={(kontrak.error as Error).message} onRetry={() => kontrak.refetch()} />}
      {kontrak.isSuccess && (
        <Tabel kolom={['Penyewa', 'Unit & Pemilik', 'Masa Sewa', 'Nilai Kontrak', 'KTP', 'Status Kontrak', 'Aksi']} kolomAkhirKanan>
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
              {/* Verifikasi KTP dulu tugas panel admin; sekarang pemilik yang
                  melihatnya di sini. Baris lama tanpa status dianggap "Belum". */}
              <td className="p-4"><StatusChip nilai={baris.ktp ?? 'Belum'} /></td>
              <td className="p-4"><StatusChip nilai={baris.status} /></td>
              <td className="p-4 text-right">
                {baris.status === 'Menunggu' ? (
                  <span className="inline-flex gap-1">
                    <button type="button" disabled={ubah.isPending} onClick={() => setujui(baris.id, baris.renter_name)} className="rounded-lg bg-brand-success px-3 py-2 text-micro font-bold text-brand-success-fg">
                      Setujui
                    </button>
                    <button type="button" disabled={ubah.isPending} onClick={() => tandai(baris.id, 'Dibatalkan', baris.renter_name)} className="rounded-lg border border-brand-danger-border bg-brand-surface px-3 py-2 text-micro font-bold text-brand-danger-soft-fg">
                      Tolak
                    </button>
                  </span>
                ) : baris.status === 'Aktif' ? (
                  <span className="inline-flex gap-1">
                    <button type="button" disabled={ubah.isPending} onClick={() => tandai(baris.id, 'Selesai', baris.renter_name)} className="rounded-lg bg-brand-success px-3 py-2 text-micro font-bold text-brand-success-fg">
                      Selesaikan
                    </button>
                    <button type="button" disabled={ubah.isPending} onClick={() => tandai(baris.id, 'Dibatalkan', baris.renter_name)} className="rounded-lg border border-brand-danger-border bg-brand-surface px-3 py-2 text-micro font-bold text-brand-danger-soft-fg">
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
