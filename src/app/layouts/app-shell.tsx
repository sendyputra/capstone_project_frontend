import { useEffect } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { labelPeran, toDataRole } from '@/features/auth/roles'
import { useLogout, useSession } from '@/features/auth/api'
import { useTheme } from '@/lib/use-theme'
import { Button } from '@/ui/button'

/* Tata letak akar: memasang atribut tema dan peran pada elemen <html>, dan
   mengembalikan posisi gulir saat pengguna kembali satu tingkat. */
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
          <span className="font-heading text-heading-s font-bold">Nusantara Booking</span>
          <span className="ml-auto text-ui text-brand-text-muted">{session ? session.user.name : ''}</span>
          {session && <span className="text-micro uppercase tracking-wider text-brand-text-subtle">{labelPeran(session.user.role)}</span>}
          <Button variant="ghost" onClick={toggle} aria-label={theme === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'}>
            {theme === 'dark' ? 'Terang' : 'Gelap'}
          </Button>
          {session && (
            <Button variant="outline" onClick={keluar}>
              Keluar
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-brand-border bg-brand-surface py-6 text-center text-micro text-brand-text-subtle">
        © 2026 Nusantara Booking — Sistem Pengelolaan & Sewa Properti Terpadu UMKM
      </footer>
      <ScrollRestoration />
    </div>
  )
}
