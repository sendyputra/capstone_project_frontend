import { Link, useRouteError } from 'react-router'

/* Galat saat merender layar mana pun berhenti di sini. Tanpa ini React Router
   memakai penangkap bawaannya: bahasa Inggris, tanpa kerangka aplikasi, dan
   berbunyi seperti pesan untuk pengembang. Ia menggantikan seluruh kerangka,
   jadi halaman ini berdiri sendiri. */
export function RouteErrorPage() {
  const galat = useRouteError()
  const pesan = galat instanceof Error ? galat.message : 'Penyebabnya tidak terbaca.'

  return (
    <section className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-heading-l font-bold text-brand-text">Terjadi gangguan di halaman ini</h1>
      <p className="mt-2 text-body text-brand-text-muted">Muat ulang halamannya. Bila tetap gagal, kembali ke beranda.</p>
      <p className="mt-2 text-micro text-brand-text-subtle">{pesan}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 rounded-lg bg-brand-accent px-4 py-2 text-ui font-semibold text-brand-accent-fg"
      >
        Muat ulang
      </button>
      <Link className="mt-4 block font-semibold text-brand-accent" to="/">
        Kembali ke beranda
      </Link>
    </section>
  )
}
