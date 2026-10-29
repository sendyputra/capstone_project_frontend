import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useLocation } from 'react-router'
import { ApiError, type Role } from '@/api/types'
import { useLogin } from '@/features/auth/api'
import { labelPeran, toDataRole } from '@/features/auth/roles'
import { bacaSesiKedaluwarsa, bersihkanSesiKedaluwarsa } from '@/features/auth/session'
import { loginSchema, type LoginValues } from '@/features/auth/schema'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

/* Dua peran mendarat di rute awalnya sendiri: pemilik ke dasbornya, penyewa
   ke beranda publik. Layar admin sudah tidak ada di peta rute. */
function ruteAwal(role: Role): string {
  if (role === 'pemilik') return '/pemilik'
  return '/'
}

/* Tab hanya mengelompokkan akun contoh dan mengisi emailnya. Server tidak
   menerima peran saat masuk — peran datang dari akunnya, dan rute tujuan
   diambil dari jawaban server, bukan dari tab yang sedang aktif. */
const PERAN_DEMO = ['pemilik', 'penyewa'] as const
const AKUN_DEMO: Record<Role, readonly string[]> = {
  pemilik: ['wahyu@umkm.id', 'rina@umkm.id'],
  penyewa: ['bima@umkm.id', 'sari@umkm.id'],
}
const SANDI_DEMO = 'demo12345'

export function LoginPage() {
  const masuk = useLogin()
  const navigate = useNavigate()
  const lokasi = useLocation()
  const dari = (lokasi.state as { dari?: string } | null)?.dari
  const [kedaluwarsa] = useState(bacaSesiKedaluwarsa)
  const [peranDemo, setPeranDemo] = useState<Role>('pemilik')
  useEffect(() => {
    bersihkanSesiKedaluwarsa()
  }, [])
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const onSubmit = form.handleSubmit((nilai) => {
    masuk.mutate(nilai, {
      onSuccess: (hasil) => navigate(dari ?? ruteAwal(hasil.user.role), { replace: true }),
      onError: (galat) => {
        if (galat instanceof ApiError && galat.kind === 'validation' && galat.fields) {
          Object.entries(galat.fields).forEach(([bidang, pesan]) => {
            form.setError(bidang as keyof LoginValues, { message: pesan })
          })
        }
      },
    })
  })

  /* Hanya email yang diisi; sandi tetap diketik sendiri supaya tidak ada
     kredensial yang terkirim tanpa disentuh pengguna. */
  function isiEmail(email: string) {
    form.setValue('email', email)
    form.clearErrors('email')
    form.setFocus('password')
  }

  return (
    <section className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-heading-l font-bold text-brand-text">Masuk</h1>
      <p className="mt-1 text-body text-brand-text-muted">Kelola unit, kontrak, dan tagihan dari satu tempat.</p>

      {/* Aksen kartu ikut peran yang sedang dipilih: teal untuk pemilik,
          biru untuk penyewa. Murni isyarat visual, tidak dikirim ke server. */}
      <div data-role={toDataRole(peranDemo)} className="mt-6">
        <div role="group" aria-label="Jenis akun demo" className="flex gap-1 rounded-lg border border-brand-border bg-brand-surface-sunken p-1">
          {PERAN_DEMO.map((peran) => (
            <Button
              key={peran}
              type="button"
              variant="ghost"
              aria-pressed={peranDemo === peran}
              onClick={() => setPeranDemo(peran)}
              className="h-9 flex-1 rounded-md text-ui font-semibold text-brand-text-muted hover:bg-brand-surface hover:text-brand-text aria-pressed:bg-brand-accent-soft aria-pressed:text-brand-accent-soft-fg aria-pressed:hover:bg-brand-accent-soft"
            >
              {labelPeran(peran)}
            </Button>
          ))}
        </div>

        <form onSubmit={onSubmit} noValidate className="mt-3 space-y-4 rounded-xl border border-brand-border bg-brand-surface p-6 shadow-sm">
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

        <div aria-live="polite" className="mt-4 rounded-lg border border-brand-border bg-brand-surface-sunken p-3">
          <p className="text-label font-semibold tracking-label text-brand-text-muted uppercase">Akun demo {labelPeran(peranDemo)}</p>
          <ul className="mt-2 space-y-1">
            {AKUN_DEMO[peranDemo].map((email) => (
              <li key={email} className="flex items-center justify-between gap-2">
                <span className="font-mono text-ui text-brand-text">{email}</span>
                <Button type="button" variant="outline" size="sm" aria-label={`Isi email ${email}`} onClick={() => isiEmail(email)}>
                  Isi
                </Button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-ui text-brand-text-muted">
            Sandi semua akun demo: <span className="font-mono text-brand-text">{SANDI_DEMO}</span>. Tombol Isi mengisi emailnya saja; sandi tetap Anda ketik.
          </p>
          <p className="mt-1 text-label text-brand-text-muted">Tab hanya memilih contoh akun; setelah masuk, Anda diantar sesuai peran akun itu.</p>
        </div>
      </div>
    </section>
  )
}
