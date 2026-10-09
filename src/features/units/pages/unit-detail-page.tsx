import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAjukanSewa } from '@/features/bookings/api'
import { useSession } from '@/features/auth/api'
import { useUnit } from '@/features/units/api'
import { KalenderKetersediaan } from '@/features/units/components/kalender-ketersediaan'
import { formatRupiah } from '@/lib/format'
import { useToast } from '@/ui/toast'
import { Skeleton } from '@/ui/skeleton'

export function UnitDetailPage({ mode = 'penyewa' }: { mode?: 'penyewa' | 'pemilik' }) {
  const { id } = useParams()
  const unitId = Number(id)
  const unit = useUnit(unitId)
  const ajukan = useAjukanSewa()
  const { session } = useSession()
  const navigate = useNavigate()
  const { tampilkan } = useToast()
  const [galat, setGalat] = useState('')

  function kirim() {
    /* Katalog terbuka untuk pengunjung; yang menuntut akun hanya pengajuannya. */
    if (!session) {
      navigate('/masuk', { state: { dari: `/katalog/${unitId}` } })
      return
    }
    setGalat('')
    ajukan.mutate(unitId, {
      onSuccess: () => {
        tampilkan('Pengajuan sewa telah diteruskan ke WhatsApp pemilik properti.', 'success')
        navigate('/katalog')
      },
      onError: (eror) => setGalat((eror as Error).message),
    })
  }

  return (
    <section className="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <Link to="/katalog" className="inline-flex items-center gap-2 text-ui font-semibold text-brand-text-muted">
        ← Kembali
      </Link>

      {unit.isPending && <Skeleton className="h-96" />}

      {unit.data && (
        <div className="space-y-4 rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
          <img src={unit.data.image} alt={unit.data.name} className="h-56 w-full rounded-xl border border-brand-border object-cover" />
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
            <KalenderKetersediaan tanggalTerisi={unit.data.booked_dates} />
            <div className="flex items-center gap-4 pt-1 text-micro">
              <span className="flex items-center gap-1 text-brand-text-muted">
                <span className="inline-block h-3 w-3 rounded-full bg-brand-success" /> Tersedia
              </span>
              <span className="flex items-center gap-1 text-brand-text-muted">
                <span className="inline-block h-3 w-3 rounded-full bg-brand-danger" /> Terisi / Booked
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-3">
            {galat && (
              <p role="alert" className="rounded-xl border border-brand-danger-border bg-brand-danger-soft p-3 text-ui text-brand-danger-soft-fg">
                {galat}
              </p>
            )}
            {mode === 'penyewa' && (
              <button
                type="button"
                onClick={kirim}
                disabled={ajukan.isPending}
                className="w-full rounded-xl bg-brand-accent py-3 text-ui font-bold text-brand-accent-fg shadow-lg disabled:opacity-70"
              >
                {ajukan.isPending ? 'Mengirim pengajuan…' : galat ? 'Coba Lagi' : 'Ajukan Sewa via WhatsApp'}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
