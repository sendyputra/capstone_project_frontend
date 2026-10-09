import { useNavigate } from 'react-router'
import type { Role } from '@/api/types'
import { useLogin, useSession } from '@/features/auth/api'
import { useToast } from '@/ui/toast'

/* Alat pratinjau seperti pil peran di purwarupa: sekali klik masuk sebagai akun
   contoh peran itu, lalu menuju rute awalnya. Hanya hidup di mode mock — inilah
   bedanya dengan aplikasi sungguhan, yang menuntut masuk manual. */
const AKUN: { id: Role; label: string; email: string; awal: string }[] = [
  { id: 'penyewa', label: 'Penyewa', email: 'rian@mail.com', awal: '/katalog' },
  { id: 'pemilik', label: 'Pemilik', email: 'wahyu@umkm.id', awal: '/pemilik' },
  { id: 'admin', label: 'Admin', email: 'admin@nusantarabooking.id', awal: '/admin/unit' },
]

export function PreviewBar() {
  const masuk = useLogin()
  const navigate = useNavigate()
  const { tampilkan } = useToast()
  const { session } = useSession()

  if (import.meta.env.VITE_API_MOCK !== 'on') return null

  function lompat(akun: (typeof AKUN)[number]) {
    masuk.mutate(
      { email: akun.email, password: 'rahasia123' },
      {
        onSuccess: () => {
          tampilkan(`Masuk sebagai ${akun.label}.`, 'info')
          navigate(akun.awal)
        },
        onError: () => tampilkan('Akun contoh tidak dapat dimasuki.', 'danger'),
      },
    )
  }

  return (
    <div
      role="group"
      aria-label="Pratinjau peran"
      className="fixed bottom-4 left-1/2 z-[var(--z-modal)] flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-brand-border bg-brand-surface p-1 shadow-lg"
    >
      <span className="hidden px-2 text-micro font-bold uppercase tracking-label text-brand-text-subtle sm:inline">Pratinjau</span>
      {AKUN.map((akun) => (
        <button
          key={akun.id}
          type="button"
          onClick={() => lompat(akun)}
          aria-pressed={session?.user.role === akun.id}
          className={
            session?.user.role === akun.id
              ? 'whitespace-nowrap rounded-xl bg-brand-accent px-3 py-1.5 text-micro font-bold text-brand-accent-fg shadow-sm'
              : 'whitespace-nowrap rounded-xl px-3 py-1.5 text-micro font-bold text-brand-text-muted'
          }
        >
          {akun.label}
        </button>
      ))}
    </div>
  )
}
