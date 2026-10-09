import { Link } from 'react-router'

export function ForbiddenPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-heading-l font-bold text-brand-text">Halaman ini bukan untuk peran Anda</h1>
      <p className="mt-2 text-body text-brand-text-muted">Akun yang sedang masuk tidak punya akses ke bagian ini.</p>
      <Link className="mt-4 inline-block font-semibold text-brand-accent" to="/">
        Kembali ke beranda
      </Link>
    </section>
  )
}
