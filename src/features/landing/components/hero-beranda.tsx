import { FormCariUnit } from '@/features/units/components/form-cari-unit'
import type { FilterUnit } from '@/features/units/use-filter-unit'

/* Hero beranda, mengikuti purwarupa: lencana, judul dua baris berskala display,
   paragraf, lalu kartu cari di dalam hero. Judulnya sengaja tidak memakai
   `text-heading-*` — purwarupa memakai tangga display (30px, 48px di layar
   lebar) supaya ia terbaca sebagai judul halaman, bukan subjudul. */
export function HeroBeranda({ filter }: { filter: FilterUnit }) {
  return (
    <section id="hero" className="bg-hero px-4 py-16 text-brand-text-inverse shadow-inner">
      <div className="mx-auto max-w-4xl space-y-6 text-center">
        <span className="inline-block rounded-full border border-brand-teal-400 bg-brand-text-inverse/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-brand-teal-200 shadow-sm backdrop-blur-sm">
          Sistem Reservasi &amp; Pengelolaan Properti Terpadu
        </span>

        <h1 className="text-shadow-hero text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
          Cari Kontrakan, Kos, &amp; Ruang Usaha <br />
          <span className="text-brand-teal-300 underline decoration-brand-teal-400">Langsung Dari Pemilik UMKM</span>
        </h1>

        <p className="text-shadow-hero mx-auto max-w-2xl text-sm font-light text-brand-teal-100 md:text-base">
          Kemudahan pemesanan dengan informasi ketersediaan tanggal real-time dan transparansi harga tanpa komisi tersembunyi.
        </p>

        <FormCariUnit filter={filter} className="mx-auto mt-8 max-w-3xl text-left shadow-2xl" />
      </div>
    </section>
  )
}
