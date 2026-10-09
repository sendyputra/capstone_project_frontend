import { FormCariUnit } from '@/features/units/components/form-cari-unit'
import type { FilterUnit } from '@/features/units/use-filter-unit'

/* Hero beranda, seperti purwarupa: lencana, judul, paragraf, lalu kartu cari di
   dalam hero. Pengunjung tanpa akun pun melihatnya. */
export function HeroBeranda({ filter }: { filter: FilterUnit }) {
  return (
    <section id="hero" className="bg-hero px-4 py-16 text-brand-text-inverse shadow-inner">
      <div className="mx-auto max-w-4xl space-y-6 text-center">
        <span className="inline-block rounded-full border border-brand-teal-400 bg-brand-text-inverse/10 px-4 py-2 text-micro font-semibold uppercase tracking-wider text-brand-teal-200">
          Sistem Reservasi &amp; Pengelolaan Properti Terpadu
        </span>
        <h1 className="text-heading-l font-extrabold leading-tight tracking-tight">
          Cari Kontrakan, Kos, &amp; Ruang Usaha{' '}
          <span className="text-brand-teal-300 underline decoration-brand-teal-400">Langsung Dari Pemilik UMKM</span>
        </h1>
        <p className="mx-auto max-w-2xl text-body font-light text-brand-teal-100">
          Kemudahan pemesanan dengan informasi ketersediaan tanggal real-time dan transparansi harga tanpa komisi tersembunyi.
        </p>

        <FormCariUnit filter={filter} className="mx-auto mt-8 max-w-3xl text-left shadow-2xl" />
      </div>
    </section>
  )
}
