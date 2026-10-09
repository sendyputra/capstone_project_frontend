import { Link } from 'react-router'

/* Jalur tak dikenal berakhir di sini, di dalam AppShell, supaya bilah atas dan
   jalan kembali tetap ada. Tanpa rute penangkap, React Router menampilkan layar
   galat bawaannya — bahasa Inggris dan tanpa kerangka aplikasi. */
export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-heading-l font-bold text-brand-text">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-body text-brand-text-muted">Alamat yang Anda buka tidak ada atau sudah dipindahkan.</p>
      <Link className="mt-4 inline-block font-semibold text-brand-accent" to="/">
        Kembali ke beranda
      </Link>
    </section>
  )
}
