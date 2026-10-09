import { Link } from 'react-router'

/* Beranda publik: satu-satunya layar yang boleh dibuka tanpa sesi, sesuai
   purwarupa (hero). Katalog penyewa ada di balik gerbang peran. */
export function LandingPage() {
  return (
    <section className="bg-hero text-brand-text-inverse">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-16 text-center">
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
        <div className="pt-2">
          <Link to="/masuk" className="inline-block rounded-lg bg-brand-accent px-6 py-3 text-ui font-bold text-brand-accent-fg shadow-lg">
            Masuk
          </Link>
        </div>
      </div>
    </section>
  )
}
