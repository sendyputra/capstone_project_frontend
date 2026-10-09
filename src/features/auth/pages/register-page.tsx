import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { useRegister } from '@/features/auth/api'
import { loginSchema, type LoginValues } from '@/features/auth/schema'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

type Ktp = { status: 'idle' | 'loading' | 'error' | 'sukses'; pesan: string; berkas: string; percobaan: number }

/* Pembacaan KTP disimulasikan seperti purwarupa: percobaan pertama putus
   koneksi, percobaan berikutnya berhasil. Murni di sisi layar — belum ada
   endpoint OCR di backend. */
export function RegisterPage() {
  const daftar = useRegister()
  const navigate = useNavigate()
  const [ktp, setKtp] = useState<Ktp>({ status: 'idle', pesan: '', berkas: '', percobaan: 0 })
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  function bacaKtp(berkas: string) {
    setKtp((lama) => ({ ...lama, status: 'loading', pesan: '', berkas }))
    setTimeout(() => {
      setKtp((lama) => {
        const percobaan = lama.percobaan + 1
        if (percobaan === 1) {
          return { ...lama, percobaan, status: 'error', pesan: 'KTP gagal dibaca karena koneksi terputus. Periksa jaringan, lalu coba lagi.' }
        }
        return { ...lama, percobaan, status: 'sukses', pesan: 'Data KTP terbaca. Periksa hasilnya sebelum mendaftar.' }
      })
    }, 300)
  }

  const onSubmit = form.handleSubmit((nilai) => {
    daftar.mutate(nilai, {
      onSuccess: () => navigate('/katalog', { replace: true }),
    })
  })

  return (
    <section className="mx-auto max-w-md space-y-4 px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-ui font-semibold text-brand-text-muted">
        ← Kembali
      </Link>

      <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
        <h1 className="border-b border-brand-border pb-3 text-heading-s font-bold text-brand-text">Pendaftaran Akun Baru</h1>

        <div className="space-y-2 rounded-xl border border-brand-border bg-brand-bg p-3">
          <Label htmlFor="ktp">Verifikasi KTP (Fitur OCR)</Label>
          <input
            id="ktp"
            type="file"
            accept="image/*"
            aria-label="Berkas KTP"
            onChange={(e) => {
              const berkas = e.target.files?.[0]
              if (berkas) bacaKtp(berkas.name)
            }}
            className="w-full text-micro text-brand-text-muted"
          />
          {ktp.status === 'idle' && <p className="text-micro text-brand-text-subtle">Unggah foto KTP Anda untuk verifikasi identitas penyewa otomatis.</p>}
          {ktp.status === 'loading' && <p className="text-ui text-brand-text-muted">Membaca berkas KTP…</p>}
          {ktp.status === 'error' && (
            <div role="alert" className="space-y-2">
              <p className="text-ui text-brand-danger-soft-fg">{ktp.pesan}</p>
              <button type="button" onClick={() => bacaKtp(ktp.berkas)} className="rounded-lg bg-brand-danger px-3 py-1.5 text-micro font-semibold text-brand-danger-fg">
                Coba Lagi
              </button>
            </div>
          )}
          {ktp.status === 'sukses' && <p className="text-ui text-brand-success-soft-fg">{ktp.pesan}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email / Nomor WhatsApp</Label>
          <Input id="email" {...form.register('email')} placeholder="user@example.com" />
          {form.formState.errors.email && <p className="text-ui text-brand-danger">{form.formState.errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Kata sandi</Label>
          <Input id="password" type="password" {...form.register('password')} />
          {form.formState.errors.password && <p className="text-ui text-brand-danger">{form.formState.errors.password.message}</p>}
        </div>

        {daftar.isError && (
          <p role="alert" className="rounded-md border border-brand-danger-border bg-brand-danger-soft p-3 text-ui text-brand-danger-soft-fg">
            {(daftar.error as Error).message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={daftar.isPending}>
          {daftar.isPending ? 'Mendaftarkan…' : 'Daftar Sekarang'}
        </Button>
      </form>
    </section>
  )
}
