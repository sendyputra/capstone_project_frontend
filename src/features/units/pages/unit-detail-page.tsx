import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useSession } from '@/features/auth/api'
import { useBuatKontrak } from '@/features/contracts/api'
import { useUnit } from '@/features/units/api'
import { BlokirTanggal } from '@/features/units/components/blokir-tanggal'
import { KalenderKetersediaan } from '@/features/units/components/kalender-ketersediaan'
import { GambarUnit } from '@/features/units/components/gambar-unit'
import { formatRupiah, formatTanggalPendek } from '@/lib/format'
import { hitungSewa, tanggalBentrok } from '@/lib/sewa'
import { tanggalHariIni } from '@/lib/tanggal'
import { ErrorState } from '@/ui/error-state'
import { useToast } from '@/ui/toast'
import { Skeleton } from '@/ui/skeleton'

export function UnitDetailPage({ mode = 'penyewa' }: { mode?: 'penyewa' | 'pemilik' }) {
  const { id } = useParams()
  const unitId = Number(id)
  const unit = useUnit(unitId)
  const buatKontrak = useBuatKontrak()
  const { session } = useSession()
  const navigate = useNavigate()
  const { tampilkan } = useToast()
  const [galat, setGalat] = useState('')
  /* Tanggal kalender WIB, bukan potongan `toISOString()` yang masih UTC: nilai
     awalnya sekaligus `min` input, jadi keduanya harus memakai sumber yang sama. */
  const [mulai, setMulai] = useState(tanggalHariIni)
  const [durasi, setDurasi] = useState(3)
  const hariIni = tanggalHariIni()

  function kirim() {
    /* Katalog terbuka untuk pengunjung; yang menuntut akun hanya pengajuannya. */
    if (!session) {
      navigate('/masuk', { state: { dari: `/katalog/${unitId}` } })
      return
    }
    if (!unit.data) return
    /* Input date bisa dikosongkan; `hitungSewa` mensyaratkan tanggal `YYYY-MM-DD`,
       jadi batasnya di sini — bukan di dalam fungsi itu. */
    if (!mulai) {
      setGalat('Tanggal mulai sewa wajib diisi.')
      return
    }
    if (mulai < hariIni) {
      setGalat('Tanggal mulai sewa tidak boleh sebelum hari ini.')
      return
    }
    const { akhir, total } = hitungSewa(mulai, durasi, unit.data.price)
    /* `booked_dates` sudah gabungan kontrak aktif dan tanggal diblokir, jadi satu
       daftar itu cukup untuk menolak lebih awal — pengguna melihat tanggal mana
       yang menabrak, bukan pesan 422 dari server setelah menunggu. */
    const bentrok = tanggalBentrok(mulai, akhir, unit.data.booked_dates)
    if (bentrok) {
      setGalat(`Tanggal ${formatTanggalPendek(bentrok)} sudah terisi atau diblokir. Pilih tanggal lain.`)
      return
    }
    setGalat('')
    buatKontrak.mutate(
      { unit_id: unitId, start_date: mulai, end_date: akhir, total_price: total },
      {
        onSuccess: () => {
          tampilkan('Pengajuan sewa terkirim dan masuk daftar pengajuan pemilik.', 'success')
          navigate('/katalog')
        },
        onError: (eror) => setGalat((eror as Error).message),
      },
    )
  }

  return (
    <section className="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <Link to="/katalog" className="inline-flex items-center gap-2 text-ui font-semibold text-brand-text-muted">
        ← Kembali
      </Link>

      {unit.isPending && <Skeleton className="h-96" />}

      {/* Unit yang tidak ada menjawab 404; tanpa cabang ini halamannya kosong. */}
      {unit.isError && <ErrorState message={(unit.error as Error).message} onRetry={() => unit.refetch()} />}

      {unit.data && (
        <div className="space-y-4 rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
          <GambarUnit src={unit.data.image} alt={unit.data.name} className="h-56 w-full rounded-xl border border-brand-border object-cover" />
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-heading-m font-bold text-brand-text">{unit.data.name}</h1>
              <p className="mt-1 text-micro text-brand-text-muted">{unit.data.address}</p>
            </div>
            <span className="text-body font-extrabold text-brand-accent">{formatRupiah(unit.data.price)} / bln</span>
          </div>

          <div className="space-y-2 border-y border-brand-border py-3">
            <h2 className="text-ui font-bold text-brand-text">Fasilitas Unit:</h2>
            <div className="flex flex-wrap gap-2">
              {unit.data.facilities.map((fasilitas) => (
                <span key={fasilitas} className="rounded-lg bg-brand-surface-sunken px-3 py-1 text-micro font-medium text-brand-text">
                  {fasilitas}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-ui font-bold text-brand-text">Kalender Ketersediaan Tanggal:</h2>
            <KalenderKetersediaan tanggalTerisi={unit.data.booked_dates} tanggalDiblokir={unit.data.blocked_dates} />
            {mode === 'pemilik' && <BlokirTanggal unitId={unitId} />}
          </div>

          <div className="space-y-2 pt-3">
            {galat && (
              <p role="alert" className="rounded-xl border border-brand-danger-border bg-brand-danger-soft p-3 text-ui text-brand-danger-soft-fg">
                {galat}
              </p>
            )}
            {mode === 'penyewa' && (
              <>
                <label className="block text-ui font-semibold text-brand-text">
                  Mulai sewa
                  <input type="date" required min={hariIni} value={mulai} onChange={(e) => setMulai(e.target.value)} className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2" />
                </label>
                <label className="block text-ui font-semibold text-brand-text">
                  Durasi
                  <select value={durasi} onChange={(e) => setDurasi(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2">
                    {[1, 3, 6, 12].map((bulan) => <option key={bulan} value={bulan}>{bulan} bulan</option>)}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={kirim}
                  disabled={buatKontrak.isPending}
                  className="w-full rounded-xl bg-brand-accent py-3 text-ui font-bold text-brand-accent-fg shadow-lg disabled:opacity-70"
                >
                  {buatKontrak.isPending ? 'Mengirim pengajuan…' : galat ? 'Coba Lagi' : 'Ajukan Sewa'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
