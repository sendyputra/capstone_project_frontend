import { zodResolver } from '@hookform/resolvers/zod'
import { Check } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import logo from '@/assets/logo-nusantara.png'
import { useRegister } from '@/features/auth/api'
import { bacaKtp as bacaBerkasKtp } from '@/features/auth/ocr/bacaKtp'
import { labelPeran, toDataRole } from '@/features/auth/roles'
import { registerSchema, type RegisterValues } from '@/features/auth/schema'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

type Ktp = { status: 'idle' | 'loading' | 'error' | 'sukses'; pesan: string }
type Peran = RegisterValues['role']

/* Tab peran hanya mengubah aksen kartu, baris bantuan, dan nilai `role` yang
   ikut terkirim; susunan isian dan perilaku kirim tidak bergantung padanya. */
const TAB_PERAN: readonly Peran[] = ['penyewa', 'pemilik']

/* Kedua baris dibuat sepanjang mungkin sama supaya menukar tab tidak menggeser
   isian di bawahnya. */
const BANTUAN_PERAN: Record<Peran, string> = {
  penyewa: 'Cari unit, ajukan sewa, lalu pantau tagihan.',
  pemilik: 'Kelola unit, kontrak, dan tagihan penyewa.',
}

/* Fakta saja, tanpa angka atau janji yang tidak bisa dibuktikan. */
const FAKTA = [
  'Kos, kontrakan, ruang usaha, dan apartemen dalam satu katalog.',
  'Penyewa mencari unit lalu mengajukan sewa; pemilik meninjaunya.',
  'Pendaftaran memverifikasi KTP: NIK dan nama terbaca dari foto.',
]

/* KTP dibaca di peramban dengan Tesseract.js; tidak ada endpoint OCR. Bila
   hasilnya tidak meyakinkan, NIK dan nama diisi manual. Berkasnya sendiri tetap
   disimpan sebagai `File` dan ikut terkirim sebagai bagian `ktp` pada
   `multipart/form-data` saat mendaftar — backend yang memverifikasinya. */
export function RegisterPage() {
  const daftar = useRegister()
  const navigate = useNavigate()
  const [ktp, setKtp] = useState<Ktp>({ status: 'idle', pesan: '' })
  const [berkasKtp, setBerkasKtp] = useState<File | null>(null)
  const [galatBerkas, setGalatBerkas] = useState('')
  /* Nilai yang terakhir diisi OCR, supaya berkas baru tidak mewarisi NIK/nama
     dari berkas sebelumnya — tetapi isian manual pengguna tidak ikut dibuang. */
  const terakhirOcr = useRef({ nik: '', nama: '' })
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', nik: '', email: '', password: '', password_confirmation: '', role: 'penyewa' },
  })
  const peran = useWatch({ control: form.control, name: 'role' })

  async function bacaBerkas(berkas: File) {
    setBerkasKtp(berkas)
    /* Berkas sudah dipilih, jadi keluhan "wajib diunggah" tidak berlaku lagi. */
    setGalatBerkas('')
    /* Hanya nilai hasil OCR berkas sebelumnya yang dikosongkan; isian yang
       diketik pengguna sendiri dipertahankan bila berkas baru gagal dibaca. */
    const isi = form.getValues()
    if (isi.nik && isi.nik === terakhirOcr.current.nik) form.setValue('nik', '')
    if (isi.name && isi.name === terakhirOcr.current.nama) form.setValue('name', '')
    setKtp({ status: 'loading', pesan: '' })
    try {
      const hasil = await bacaBerkasKtp(berkas)
      /* Hanya timpa isian yang sudah diketik pengguna bila OCR benar-benar
         mendapat nilai; hasil kosong tidak boleh menghapus isian manual. */
      if (hasil.nik) form.setValue('nik', hasil.nik)
      if (hasil.nama) form.setValue('name', hasil.nama)
      terakhirOcr.current = { nik: hasil.nik, nama: hasil.nama }
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
    /* Berkas KTP wajib ada sebelum apa pun dikirim. Pemeriksaan ini sengaja di
       peramban: tidak perlu perjalanan ke server untuk menolak berkas kosong,
       dan pesannya bisa tampil seketika. */
    if (!berkasKtp) {
      setGalatBerkas('Berkas KTP wajib diunggah.')
      return
    }
    setGalatBerkas('')
    /* Urutan bagian tidak penting bagi server; yang penting `ktp` berupa berkas,
       bukan teks, supaya `request.formData()` di backend melihatnya sebagai
       unggahan. */
    const badan = new FormData()
    badan.set('name', nilai.name)
    badan.set('nik', nilai.nik)
    badan.set('email', nilai.email)
    badan.set('password', nilai.password)
    badan.set('password_confirmation', nilai.password_confirmation)
    /* Kontrak API memakai enum Inggris (`owner`/`tenant`); mock menerjemahkan
       balik ke peran domain. */
    badan.set('role', nilai.role === 'pemilik' ? 'owner' : 'tenant')
    badan.set('ktp', berkasKtp)
    daftar.mutate(badan, { onSuccess: () => navigate('/katalog', { replace: true }) })
  })

  return (
    <section className="mx-auto max-w-container px-4 py-8 sm:py-10">
      <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-ui font-semibold text-brand-text-muted">
        ← Kembali
      </Link>

      {/* Aksen ikut tab yang sedang dipilih: biru penyewa, teal pemilik. Atribut
          dipasang di sini, bukan di <html>, supaya tidak berebut dengan AppShell
          yang memegang data-role sesuai sesi. */}
      <div
        data-role={toDataRole(peran)}
        className="mx-auto mt-4 grid w-full max-w-xl min-w-0 gap-6 lg:mx-0 lg:max-w-none lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="hidden min-w-0 flex-col gap-6 rounded-2xl border border-brand-border bg-brand-surface p-8 lg:sticky lg:top-24 lg:flex">
          {/* Aset logo sudah memuat wordmark, jadi tidak ada teks merek kedua di sini. */}
          {/* Logo penuh memuat wordmark navy yang hilang di tema gelap, jadi ia
              diberi alas terang; di tema terang alasnya sama dengan permukaan. */}
          <img
            src={logo}
            alt="Nusantara Booking"
            width={500}
            height={500}
            className="h-24 w-auto self-start rounded-xl bg-brand-neutral-50 p-2 object-contain"
          />

          <p className="text-body text-brand-text-muted">Sistem pengelolaan dan sewa properti untuk UMKM.</p>

          <ul className="space-y-3">
            {FAKTA.map((fakta) => (
              <li key={fakta} className="flex gap-3">
                <Check className="mt-1 h-4 w-4 shrink-0 text-brand-accent" aria-hidden="true" />
                <span className="min-w-0 text-body text-brand-text-muted">{fakta}</span>
              </li>
            ))}
          </ul>
        </aside>

        <form
          onSubmit={onSubmit}
          noValidate
          className="min-w-0 space-y-5 rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm sm:p-6"
        >
          <div className="space-y-1">
            <h1 className="text-heading-s font-bold text-brand-text">Pendaftaran Akun Baru</h1>
            <p className="text-ui text-brand-text-muted">Pilih peran, lalu isi data sesuai KTP Anda.</p>
          </div>

          <div className="space-y-2">
            <span id="label-peran" className="block text-label font-bold tracking-label text-brand-text-muted uppercase">
              Daftar sebagai
            </span>
            <div role="group" aria-labelledby="label-peran" className="flex gap-2">
              {TAB_PERAN.map((pilihan) => (
                <Button
                  key={pilihan}
                  type="button"
                  variant="ghost"
                  aria-pressed={peran === pilihan}
                  onClick={() => form.setValue('role', pilihan)}
                  className="h-11 min-w-0 flex-1 rounded-md border border-brand-border text-ui font-semibold text-brand-text-muted hover:bg-brand-surface hover:text-brand-text aria-pressed:border-brand-accent aria-pressed:bg-brand-accent-soft aria-pressed:text-brand-accent-soft-fg aria-pressed:hover:bg-brand-accent-soft"
                >
                  {labelPeran(pilihan)}
                </Button>
              ))}
            </div>
            <p aria-live="polite" className="min-h-11 text-ui text-brand-text-muted">
              {BANTUAN_PERAN[peran]}
            </p>
          </div>

          <div className="min-w-0 space-y-2 rounded-xl border border-brand-border bg-brand-bg p-4">
            <Label htmlFor="ktp">Verifikasi KTP (Fitur OCR)</Label>
            <input
              id="ktp"
              type="file"
              accept="image/*"
              aria-label="Berkas KTP"
              onChange={(e) => {
                const berkas = e.target.files?.[0]
                /* Kosongkan nilai input supaya berkas yang sama bisa dipilih
                   lagi setelah percobaan gagal — tanpa ini peramban tidak
                   memicu `change` untuk berkas yang sama. */
                e.target.value = ''
                if (berkas) void bacaBerkas(berkas)
              }}
              className="block w-full min-w-0 text-ui text-brand-text-muted file:mr-3 file:h-11 file:rounded-md file:border file:border-brand-border file:bg-brand-surface-sunken file:px-3 file:text-ui file:font-semibold file:text-brand-text"
            />
            {ktp.status === 'idle' && (
              <p className="text-ui break-words text-brand-text-subtle">Unggah foto KTP Anda untuk verifikasi identitas otomatis.</p>
            )}
            {ktp.status === 'loading' && <p className="text-ui text-brand-text-muted">Membaca berkas KTP…</p>}
            {ktp.status === 'error' && (
              <p role="alert" className="text-ui break-words text-brand-danger-soft-fg">
                {ktp.pesan}
              </p>
            )}
            {ktp.status === 'sukses' && <p className="text-ui break-words text-brand-success-soft-fg">{ktp.pesan}</p>}
            {galatBerkas && (
              <p role="alert" className="text-ui break-words text-brand-danger">
                {galatBerkas}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="name">Nama lengkap</Label>
              <Input id="name" {...form.register('name')} placeholder="Nama sesuai KTP" />
              {form.formState.errors.name && <p className="text-ui break-words text-brand-danger">{form.formState.errors.name.message}</p>}
            </div>

            <div className="min-w-0 space-y-2">
              <Label htmlFor="nik">NIK</Label>
              <Input id="nik" inputMode="numeric" {...form.register('nik')} placeholder="16 digit sesuai KTP" />
              {form.formState.errors.nik && <p className="text-ui break-words text-brand-danger">{form.formState.errors.nik.message}</p>}
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="email">Email / Nomor WhatsApp</Label>
            <Input id="email" {...form.register('email')} placeholder="user@example.com" />
            {form.formState.errors.email && <p className="text-ui break-words text-brand-danger">{form.formState.errors.email.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="password">Kata sandi</Label>
              <Input id="password" type="password" {...form.register('password')} />
              {form.formState.errors.password && <p className="text-ui break-words text-brand-danger">{form.formState.errors.password.message}</p>}
            </div>

            <div className="min-w-0 space-y-2">
              <Label htmlFor="password_confirmation">Ulangi kata sandi</Label>
              <Input id="password_confirmation" type="password" {...form.register('password_confirmation')} />
              {form.formState.errors.password_confirmation && (
                <p className="text-ui break-words text-brand-danger">{form.formState.errors.password_confirmation.message}</p>
              )}
            </div>
          </div>

          {daftar.isError && (
            <p role="alert" className="rounded-md border border-brand-danger-border bg-brand-danger-soft p-3 text-ui break-words text-brand-danger-soft-fg">
              {(daftar.error as Error).message}
            </p>
          )}

          <Button type="submit" className="h-11 w-full" disabled={daftar.isPending}>
            {daftar.isPending ? 'Mendaftarkan…' : 'Daftar Sekarang'}
          </Button>
        </form>
      </div>
    </section>
  )
}
