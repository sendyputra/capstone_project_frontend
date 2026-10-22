import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { useRegister } from '@/features/auth/api'
import { bacaKtp as bacaBerkasKtp } from '@/features/auth/ocr/bacaKtp'
import { registerSchema, type RegisterValues } from '@/features/auth/schema'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

type Ktp = { status: 'idle' | 'loading' | 'error' | 'sukses'; pesan: string }

/* KTP dibaca di peramban dengan Tesseract.js; tidak ada unggahan berkas dan
   tidak ada endpoint OCR. Bila hasilnya tidak meyakinkan, NIK dan nama diisi
   manual. Berkas disimpan di state agar bisa dikirim pada tugas berikutnya. */
export function RegisterPage() {
  const daftar = useRegister()
  const navigate = useNavigate()
  const [ktp, setKtp] = useState<Ktp>({ status: 'idle', pesan: '' })
  const [, setBerkasKtp] = useState<File | null>(null)
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', nik: '', email: '', password: '', password_confirmation: '', role: 'penyewa' },
  })

  async function bacaBerkas(berkas: File) {
    setBerkasKtp(berkas)
    setKtp({ status: 'loading', pesan: '' })
    try {
      const hasil = await bacaBerkasKtp(berkas)
      form.setValue('nik', hasil.nik)
      form.setValue('name', hasil.nama)
      setKtp(
        hasil.yakin
          ? { status: 'sukses', pesan: 'Data KTP terbaca. Periksa hasilnya sebelum mendaftar.' }
          : { status: 'error', pesan: 'KTP tidak terbaca. Isi NIK dan nama secara manual.' },
      )
    } catch {
      setKtp({ status: 'error', pesan: 'KTP tidak terbaca. Isi NIK dan nama secara manual.' })
    }
  }

  const onSubmit = form.handleSubmit((nilai) => {
    daftar.mutate(
      { email: nilai.email, password: nilai.password },
      { onSuccess: () => navigate('/katalog', { replace: true }) },
    )
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
              if (berkas) void bacaBerkas(berkas)
            }}
            className="w-full text-micro text-brand-text-muted"
          />
          {ktp.status === 'idle' && <p className="text-micro text-brand-text-subtle">Unggah foto KTP Anda untuk verifikasi identitas penyewa otomatis.</p>}
          {ktp.status === 'loading' && <p className="text-ui text-brand-text-muted">Membaca berkas KTP…</p>}
          {ktp.status === 'error' && (
            <p role="alert" className="text-ui text-brand-danger-soft-fg">
              {ktp.pesan}
            </p>
          )}
          {ktp.status === 'sukses' && <p className="text-ui text-brand-success-soft-fg">{ktp.pesan}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nama lengkap</Label>
          <Input id="name" {...form.register('name')} placeholder="Nama sesuai KTP" />
          {form.formState.errors.name && <p className="text-ui text-brand-danger">{form.formState.errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nik">NIK</Label>
          <Input id="nik" inputMode="numeric" {...form.register('nik')} placeholder="16 digit sesuai KTP" />
          {form.formState.errors.nik && <p className="text-ui text-brand-danger">{form.formState.errors.nik.message}</p>}
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

        <div className="space-y-2">
          <Label htmlFor="password_confirmation">Ulangi kata sandi</Label>
          <Input id="password_confirmation" type="password" {...form.register('password_confirmation')} />
          {form.formState.errors.password_confirmation && (
            <p className="text-ui text-brand-danger">{form.formState.errors.password_confirmation.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Peran</Label>
          <select
            id="role"
            {...form.register('role')}
            className="h-8 w-full rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1 text-sm text-brand-text"
          >
            <option value="penyewa">Penyewa</option>
            <option value="pemilik">Pemilik</option>
          </select>
          {form.formState.errors.role && <p className="text-ui text-brand-danger">{form.formState.errors.role.message}</p>}
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
