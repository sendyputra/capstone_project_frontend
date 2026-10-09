import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { ApiError, type Role } from '@/api/types'
import { useLogin } from '@/features/auth/api'
import { bacaSesiKedaluwarsa, bersihkanSesiKedaluwarsa } from '@/features/auth/session'
import { loginSchema, type LoginValues } from '@/features/auth/schema'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

/* Tiap peran mendarat di rute awalnya sendiri; admin belum punya beranda
   penuh, jadi diarahkan ke halaman admin pertama yang ada di peta rute. */
function ruteAwal(role: Role): string {
  if (role === 'pemilik') return '/pemilik'
  if (role === 'admin') return '/admin/unit'
  return '/'
}

export function LoginPage() {
  const masuk = useLogin()
  const navigate = useNavigate()
  const [kedaluwarsa] = useState(bacaSesiKedaluwarsa)
  useEffect(() => {
    bersihkanSesiKedaluwarsa()
  }, [])
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const onSubmit = form.handleSubmit((nilai) => {
    masuk.mutate(nilai, {
      onSuccess: (hasil) => navigate(ruteAwal(hasil.user.role), { replace: true }),
      onError: (galat) => {
        if (galat instanceof ApiError && galat.kind === 'validation' && galat.fields) {
          Object.entries(galat.fields).forEach(([bidang, pesan]) => {
            form.setError(bidang as keyof LoginValues, { message: pesan })
          })
        }
      },
    })
  })

  return (
    <section className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-heading-l font-bold text-brand-text">Masuk</h1>
      <p className="mt-1 text-body text-brand-text-muted">Kelola unit, kontrak, dan tagihan dari satu tempat.</p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4 rounded-xl border border-brand-border bg-brand-surface p-6 shadow-sm">
        {kedaluwarsa && (
          <p role="alert" className="rounded-md border border-brand-danger-border bg-brand-danger-soft p-3 text-ui text-brand-danger-soft-fg">
            Sesi Anda berakhir. Silakan masuk kembali.
          </p>
        )}

        {masuk.isError && !form.formState.errors.email && (
          <p role="alert" className="rounded-md border border-brand-danger-border bg-brand-danger-soft p-3 text-ui text-brand-danger-soft-fg">
            {(masuk.error as Error).message}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email / Nomor WhatsApp</Label>
          <Input id="email" type="text" autoComplete="username" aria-invalid={Boolean(form.formState.errors.email)} {...form.register('email')} />
          {form.formState.errors.email && <p className="text-ui text-brand-danger">{form.formState.errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Kata sandi</Label>
          <Input id="password" type="password" autoComplete="current-password" aria-invalid={Boolean(form.formState.errors.password)} {...form.register('password')} />
          {form.formState.errors.password && <p className="text-ui text-brand-danger">{form.formState.errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={masuk.isPending}>
          {masuk.isPending ? 'Memeriksa…' : 'Masuk'}
        </Button>
      </form>

      <p className="mt-4 text-ui text-brand-text-muted">
        Akun demo: wahyu@umkm.id (Pemilik), rina@umkm.id (Pemilik), admin@nusantarabooking.id (Admin). Kata sandi apa pun minimal 8 karakter.
      </p>
    </section>
  )
}
