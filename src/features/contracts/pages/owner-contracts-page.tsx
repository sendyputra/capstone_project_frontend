import { useState, type FormEvent } from 'react'
import type { ContractRow, EndReason } from '@/api/types'
import { useBuatKontrak, useContracts, useUbahStatusKontrak, useUnduhLaporanKontrak } from '@/features/contracts/api'
import { usePayments } from '@/features/billing/api'
import { useTenants } from '@/features/tenants/api'
import { useMyUnits } from '@/features/units/api'
import { formatRupiah, formatTanggal, formatTanggalPendek, formatWaktu } from '@/lib/format'
import { hitungSewa, LABEL_ALASAN, labelStatusKontrak, PILIHAN_ALASAN } from '@/lib/sewa'
import { susunTagihan } from '@/lib/tagihan'
import { tanggalHariIni } from '@/lib/tanggal'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'
import { StatusChip } from '@/ui/status-chip'
import { TabelSaring } from '@/ui/tabel-saring'
import { useToast } from '@/ui/toast'

/* Penghentian dini selalu lewat panel ini: satu klik "Selesaikan" dulu langsung
   mengakhiri sewa tanpa sebab yang bisa dibaca penyewa. */
type Penghentian = { kontrak: ContractRow; status: 'Selesai' | 'Dibatalkan' }

/* Spec §5: kontrak `Menunggu` tampil lebih dulu supaya pemilik melihat
   pekerjaannya sebelum daftar berjalan. Hanya kelompok itu yang dipindah —
   urutan sisanya dipertahankan apa adanya dari server (tanpa mengurutkan ulang
   berdasarkan status lain). */
function urutkanMenungguDulu(daftar: ContractRow[]): ContractRow[] {
  return [...daftar.filter((baris) => baris.status === 'Menunggu'), ...daftar.filter((baris) => baris.status !== 'Menunggu')]
}

export function OwnerContractsPage() {
  const kontrak = useContracts()
  const tagihan = usePayments()
  const ubah = useUbahStatusKontrak()
  const unduhLaporan = useUnduhLaporanKontrak()
  const buat = useBuatKontrak()
  const penyewa = useTenants()
  const unitSaya = useMyUnits()
  const { tampilkan } = useToast()
  const daftar = urutkanMenungguDulu(kontrak.data ?? [])
  const aktif = daftar.filter((baris) => baris.status === 'Aktif').length
  /* Status kontrak dan status tagihan dua sumbu berbeda: kontrak "Aktif" bisa
     saja punya bulan yang belum dibayar. Badge ini membuat bedanya terlihat. */
  const tunggakan = new Map<number, number>()
  for (const baris of susunTagihan(kontrak.data ?? [], tagihan.data ?? [], tanggalHariIni(), { semuaKontrak: true })) {
    if (baris.status === 'Tagihan Belum Dibayar') {
      tunggakan.set(baris.contract_id, (tunggakan.get(baris.contract_id) ?? 0) + 1)
    }
  }
  const [bukaForm, setBukaForm] = useState(false)
  const [penyewaId, setPenyewaId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [mulai, setMulai] = useState('')
  const [durasi, setDurasi] = useState(3)
  const [galatForm, setGalatForm] = useState('')
  const [akhiri, setAkhiri] = useState<Penghentian | null>(null)
  const [alasan, setAlasan] = useState<EndReason | ''>('')
  const [catatan, setCatatan] = useState('')
  const [tanggalBerhenti, setTanggalBerhenti] = useState(tanggalHariIni())
  const [galatAkhiri, setGalatAkhiri] = useState('')

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

  /* Penolakan pengajuan bukan penghentian dini: sewanya belum pernah berjalan,
     jadi tidak ada masa sewa yang harus dijelaskan. */
  function tolakPengajuan(id: number, nama: string) {
    ubah.mutate(
      { id, status: 'Dibatalkan' },
      {
        onSuccess: () => tampilkan(`Pengajuan ${nama} ditolak.`, 'danger'),
        onError: (galat) => tampilkan((galat as Error).message, 'danger'),
      },
    )
  }

  function bukaPenghentian(kontrak: ContractRow, status: 'Selesai' | 'Dibatalkan') {
    setAkhiri({ kontrak, status })
    setAlasan('')
    setCatatan('')
    setTanggalBerhenti(tanggalHariIni())
    setGalatAkhiri('')
  }

  function tutupPenghentian() {
    setAkhiri(null)
    setGalatAkhiri('')
  }

  function simpanPenghentian(peristiwa: FormEvent) {
    peristiwa.preventDefault()
    if (!akhiri) return
    if (!alasan) {
      setGalatAkhiri('Alasan penghentian wajib dipilih.')
      return
    }
    if (alasan === 'lainnya' && !catatan.trim()) {
      setGalatAkhiri('Catatan wajib diisi bila alasannya Lainnya.')
      return
    }
    const { kontrak, status } = akhiri
    ubah.mutate(
      {
        id: kontrak.id,
        status,
        ended_at: tanggalBerhenti,
        end_reason: alasan,
        end_note: catatan.trim() || undefined,
      },
      {
        onSuccess: () => {
          tutupPenghentian()
          tampilkan(
            `Kontrak ${kontrak.renter_name} ${status === 'Selesai' ? 'diselesaikan' : 'dihentikan'}.`,
            status === 'Selesai' ? 'success' : 'danger',
          )
        },
        onError: (galat) => setGalatAkhiri((galat as Error).message),
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

      {akhiri && (
        <form
          onSubmit={simpanPenghentian}
          aria-label="Akhiri kontrak"
          className="grid gap-3 rounded-xl border border-brand-border bg-brand-bg p-4 sm:grid-cols-4"
        >
          <p className="sm:col-span-4 text-ui text-brand-text">
            {akhiri.status === 'Selesai' ? 'Selesaikan' : 'Hentikan'} sewa {akhiri.kontrak.renter_name} di{' '}
            {akhiri.kontrak.unit_title}. Tagihan berhenti pada tanggal penghentian, sedangkan masa sewa yang
            disepakati tetap tercatat di riwayat.
          </p>
          <label className="block text-ui font-semibold text-brand-text">
            Tanggal berhenti
            <input
              type="date"
              required
              min={akhiri.kontrak.start_date}
              max={akhiri.kontrak.end_date}
              value={tanggalBerhenti}
              onChange={(e) => setTanggalBerhenti(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2"
            />
          </label>
          <label className="block text-ui font-semibold text-brand-text">
            Alasan
            <select
              value={alasan}
              onChange={(e) => setAlasan(e.target.value as EndReason | '')}
              className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2"
            >
              <option value="">Pilih alasan</option>
              {PILIHAN_ALASAN.map(([nilai, label]) => (
                <option key={nilai} value={nilai}>{label}</option>
              ))}
            </select>
          </label>
          <label className="block text-ui font-semibold text-brand-text sm:col-span-2">
            Catatan {alasan === 'lainnya' ? '(wajib)' : '(opsional)'}
            <input
              value={catatan}
              maxLength={500}
              onChange={(e) => setCatatan(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2"
            />
          </label>
          <div className="flex items-end gap-2 sm:col-span-4">
            <button
              type="submit"
              disabled={ubah.isPending}
              className="rounded-lg bg-brand-accent px-4 py-2 text-ui font-semibold text-brand-accent-fg disabled:opacity-70"
            >
              {ubah.isPending ? 'Menyimpan…' : 'Simpan penghentian'}
            </button>
            <button
              type="button"
              onClick={tutupPenghentian}
              className="rounded-lg border border-brand-border px-4 py-2 text-ui font-semibold text-brand-text"
            >
              Batal
            </button>
          </div>
          {galatAkhiri && (
            <p role="alert" className="sm:col-span-4 rounded-lg border border-brand-danger-border bg-brand-danger-soft p-3 text-ui text-brand-danger-soft-fg">
              {galatAkhiri}
            </p>
          )}
        </form>
      )}

      {kontrak.isPending && <Skeleton className="h-40" />}
      {kontrak.isError && <ErrorState message={(kontrak.error as Error).message} onRetry={() => kontrak.refetch()} />}
      {kontrak.isSuccess && (
        <TabelSaring
          kolom={['Penyewa', 'Unit & Pemilik', 'Masa Sewa', 'Dibuat', 'Nilai Kontrak', 'KTP', 'Status Kontrak', 'Aksi']}
          baris={daftar}
          urut={{
            banding: {
              Penyewa: (a, b) => a.renter_name.localeCompare(b.renter_name),
              'Unit & Pemilik': (a, b) => `${a.unit_title} ${a.owner_name}`.localeCompare(`${b.unit_title} ${b.owner_name}`),
              'Masa Sewa': (a, b) => a.start_date.localeCompare(b.start_date),
              Dibuat: (a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''),
              'Nilai Kontrak': (a, b) => a.monthly - b.monthly,
              KTP: (a, b) => (a.ktp ?? 'Belum').localeCompare(b.ktp ?? 'Belum'),
              'Status Kontrak': (a, b) => labelStatusKontrak(a).localeCompare(labelStatusKontrak(b)),
            },
          }}
          saringan={[
            { nilai: (baris) => baris.renter_name },
            { nilai: (baris) => `${baris.unit_title} ${baris.owner_name}` },
            { nilai: (baris) => `${formatTanggal(baris.start_date)} ${formatTanggal(baris.end_date)}` },
            { nilai: (baris) => formatWaktu(baris.created_at ?? '') },
            { nilai: (baris) => formatRupiah(baris.monthly) },
            { jenis: 'pilihan', nilai: (baris) => baris.ktp ?? 'Belum', pilihan: ['Terverifikasi', 'Menunggu', 'Belum'] },
            { jenis: 'pilihan', nilai: (baris) => labelStatusKontrak(baris), pilihan: ['Menunggu', 'Aktif', 'Selesai', 'Dibatalkan', 'Ditolak'] },
          ]}
          kolomAkhirKanan
        >
          {(tampil) => tampil.map((baris) => (
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
              <td className="p-4 text-brand-text-muted">{formatWaktu(baris.created_at ?? '')}</td>
              <td className="p-4 font-extrabold text-brand-accent">{formatRupiah(baris.monthly)} / bln</td>
              {/* Verifikasi KTP dulu tugas panel admin; sekarang pemilik yang
                  melihatnya di sini. Baris lama tanpa status dianggap "Belum". */}
              <td className="p-4"><StatusChip nilai={baris.ktp ?? 'Belum'} /></td>
              <td className="p-4">
                <StatusChip nilai={labelStatusKontrak(baris)} />
                {(tunggakan.get(baris.id) ?? 0) > 0 && (
                  <span className="mt-1 block text-micro font-semibold text-brand-warning-soft-fg">
                    {tunggakan.get(baris.id)} bulan belum dibayar
                  </span>
                )}
                {baris.ended_at && (
                  <span className="mt-1 block text-micro text-brand-text-subtle">
                    {formatTanggalPendek(baris.ended_at)} · {baris.end_reason ? LABEL_ALASAN[baris.end_reason] : '—'}
                  </span>
                )}
              </td>
              <td className="p-4 text-right">
                {baris.status === 'Menunggu' ? (
                  <span className="inline-flex gap-1">
                    <button type="button" disabled={ubah.isPending} onClick={() => setujui(baris.id, baris.renter_name)} className="rounded-lg bg-brand-success px-3 py-2 text-micro font-bold text-brand-success-fg">
                      Setujui
                    </button>
                    <button type="button" disabled={ubah.isPending} onClick={() => tolakPengajuan(baris.id, baris.renter_name)} className="rounded-lg border border-brand-danger-border bg-brand-surface px-3 py-2 text-micro font-bold text-brand-danger-soft-fg">
                      Tolak
                    </button>
                  </span>
                ) : baris.status === 'Aktif' ? (
                  <span className="inline-flex gap-1">
                    <button type="button" disabled={ubah.isPending} onClick={() => bukaPenghentian(baris, 'Selesai')} className="rounded-lg bg-brand-success px-3 py-2 text-micro font-bold text-brand-success-fg">
                      Selesaikan
                    </button>
                    <button type="button" disabled={ubah.isPending} onClick={() => bukaPenghentian(baris, 'Dibatalkan')} className="rounded-lg border border-brand-danger-border bg-brand-surface px-3 py-2 text-micro font-bold text-brand-danger-soft-fg">
                      Hentikan sewa
                    </button>
                  </span>
                ) : (
                  <span className="text-micro text-brand-text-subtle">Tidak ada tindakan</span>
                )}
              </td>
            </tr>
          ))}
        </TabelSaring>
      )}
    </section>
  )
}
