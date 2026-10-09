import { Moon, Sun } from 'lucide-react'
import { useEffect } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router'
import type { Role } from '@/api/types'
import { jabatanPeran, toDataRole } from '@/features/auth/roles'
import { useLogout, useSession } from '@/features/auth/api'
import { PreviewBar } from '@/features/preview/components/preview-bar'
import { inisial } from '@/lib/format'
import { useTheme } from '@/lib/use-theme'
import { Button } from '@/ui/button'

/* Tautan kerja tiap peran — sama dengan nav purwarupa. */
const TAUTAN: Record<Role, { ke: string; label: string }[]> = {
  penyewa: [
    { ke: '/', label: 'Beranda' },
    { ke: '/katalog', label: 'Cari Unit' },
    { ke: '/tagihan', label: 'Tagihan Saya' },
  ],
  pemilik: [
    { ke: '/pemilik', label: 'Dashboard' },
    { ke: '/pemilik/unit', label: 'Unit Saya' },
    { ke: '/pemilik/pengajuan', label: 'Pengajuan Sewa' },
  ],
  admin: [
    { ke: '/admin/unit', label: 'Unit' },
    { ke: '/admin/kontrak', label: 'Kontrak' },
    { ke: '/admin/pembayaran', label: 'Pembayaran' },
    { ke: '/admin/pengguna', label: 'Pengguna' },
  ],
}

/* Warna cakram inisial mengikuti peran, seperti purwarupa: aksen untuk penyewa,
   teal pemilik untuk pemilik, dan netral untuk admin. */
function gayaInisial(role: Role) {
  if (role === 'admin') return 'bg-brand-neutral-700 text-brand-text-inverse'
  if (role === 'pemilik') return 'bg-brand-owner text-brand-text-inverse'
  return 'bg-brand-accent text-brand-accent-fg'
}

/* Tata letak akar: memasang atribut tema dan peran pada elemen <html>, nav
   sesuai peran, dan mengembalikan posisi gulir saat pengguna kembali. */
export function AppShell() {
  const { session } = useSession()
  const { theme, toggle } = useTheme()
  const keluar = useLogout()

  useEffect(() => {
    document.documentElement.dataset.role = session ? toDataRole(session.user.role) : 'renter'
  }, [session])

  return (
    <div className="flex min-h-screen flex-col bg-brand-bg text-brand-text">
      <header className="sticky top-0 z-10 border-b border-brand-border bg-brand-surface">
        <div className="mx-auto flex h-appbar max-w-container items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/demo/logo.jpg" alt="Logo Nusantara Booking" className="h-10 w-auto rounded-md object-contain" />
            <span className="font-heading text-heading-s font-bold whitespace-nowrap">
              NUSANTARA <span className="text-brand-accent">BOOKING</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-5 md:flex" aria-label="Navigasi utama">
            {(session ? TAUTAN[session.user.role] : [{ ke: '/', label: 'Beranda' }, { ke: '/katalog', label: 'Cari Unit' }]).map((tautan) => (
              <NavLink
                key={tautan.ke}
                to={tautan.ke}
                end={tautan.ke === '/'}
                className={({ isActive }) =>
                  isActive ? 'text-ui font-semibold text-brand-accent' : 'text-ui font-medium text-brand-text-muted'
                }
              >
                {tautan.label}
              </NavLink>
            ))}
            <Link to="/bantuan" className="text-ui font-medium text-brand-text-muted">
              Bantuan &amp; Layanan
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3 md:ml-0">
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'}
              aria-pressed={theme === 'dark'}
              className="rounded-lg p-2 text-brand-text-muted hover:bg-brand-surface-sunken hover:text-brand-text"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
            </button>

            {session ? (
              <>
                <span className="hidden items-center gap-2 rounded-xl border border-brand-border bg-brand-surface-sunken px-3 py-1.5 sm:flex">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-micro font-bold ${gayaInisial(session.user.role)}`}>
                    {inisial(session.user.name)}
                  </span>
                  <span className="text-left">
                    <span className="block text-micro font-bold text-brand-text">{session.user.name}</span>
                    <span className="block text-micro text-brand-text-muted">{jabatanPeran(session.user.role)}</span>
                  </span>
                </span>
                <Button variant="outline" onClick={keluar}>
                  Keluar
                </Button>
              </>
            ) : (
              <>
                <Link to="/masuk" className="px-3 py-2 text-ui font-medium text-brand-text">
                  Masuk
                </Link>
                <Link to="/daftar" className="rounded-lg bg-brand-accent px-4 py-2 text-ui font-medium text-brand-accent-fg shadow-md">
                  Daftar (OCR KTP)
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-brand-border bg-brand-surface py-6 text-center text-micro text-brand-text-subtle">
        © 2026 Nusantara Booking — Sistem Pengelolaan & Sewa Properti Terpadu UMKM
      </footer>

      <PreviewBar />
      <ScrollRestoration />
    </div>
  )
}
