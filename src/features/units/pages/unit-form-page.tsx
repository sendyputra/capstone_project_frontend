import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { TIPE_UNIT } from '@/api/types'
import { useCreateUnit } from '@/features/units/api'
import { unitFormSchema, type UnitFormInput, type UnitFormValues } from '@/features/units/schema'
import { useToast } from '@/ui/toast'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

/* Bidang didaftarkan satu per satu, bukan lewat peta, supaya jenis nilai tiap
   bidang tetap terbaca TypeScript: `price` angka, sisanya teks. */

/* Jenis sesuai penerimaan backend: jpeg/png/jpg/webp, maks 2 MB. */
const JENIS_FOTO = ['image/jpeg', 'image/png', 'image/webp']
const BATAS_FOTO = 2 * 1024 * 1024

/* `facilities` masuk formulir sebagai teks koma dan keluar FormData
   `facilities[]` per butir: pangkas spasi, buang butir kosong hasil koma
   tergantung atau ganda. */
function pecahFasilitas(teks: string): string[] {
  return teks
    .split(',')
    .map((potongan) => potongan.trim())
    .filter(Boolean)
}

export function UnitFormPage() {
  const simpan = useCreateUnit()
  const { tampilkan } = useToast()
  const navigate = useNavigate()
  /* `simpan.isPending` dibaca dari closure render dan belum berubah di antara
     dua klik beruntun; ref menutup celah itu sehingga tombol yang ditekan dua
     kali tetap mengirim satu permintaan. */
  const mengirim = useRef(false)
  const form = useForm<UnitFormInput, unknown, UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: { name: '', address: '', facilities: '', status: 'Tersedia' },
  })

  /* Berkas foto tidak masuk zod — pola berkas KTP: state, validasi manual,
     pratinjau URL objek yang dicabut saat berkas berganti atau halaman tutup. */
  const [foto, setFoto] = useState<File | null>(null)
  const [galatFoto, setGalatFoto] = useState('')
  const [pratinjau, setPratinjau] = useState('')
  useEffect(
    () => () => {
      if (pratinjau) URL.revokeObjectURL(pratinjau)
    },
    [pratinjau],
  )

  function pilihFoto(berkas: File | undefined) {
    if (!berkas) {
      setFoto(null)
      setGalatFoto('')
      return
    }
    if (!JENIS_FOTO.includes(berkas.type)) {
      setGalatFoto('Jenis berkas tidak didukung. Pakai foto JPEG, PNG, atau WebP, maksimal 2 MB.')
      return
    }
    if (berkas.size > BATAS_FOTO) {
      setGalatFoto('Ukuran foto melebihi 2 MB. Kompres dulu, lalu pilih lagi.')
      return
    }
    if (pratinjau) URL.revokeObjectURL(pratinjau)
    setFoto(berkas)
    setGalatFoto('')
    setPratinjau(URL.createObjectURL(berkas))
  }

  const onSubmit = form.handleSubmit((nilai) => {
    /* Foto yang ditolak tidak boleh lolos sebagai unit tanpa gambar: belum ada
       layar edit, jadi berkasnya tidak bisa ditambahkan kemudian. */
    if (mengirim.current || galatFoto) return
    mengirim.current = true
    simpan.mutate(
      { ...nilai, facilities: pecahFasilitas(nilai.facilities), image: foto ?? undefined },
      {
        onSuccess: () => {
          tampilkan('Unit baru tersimpan dan langsung tayang.', 'success')
          navigate('/pemilik/unit')
        },
        onError: () => {
          mengirim.current = false
        },
      },
    )
  })

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-10">
      <Link to="/pemilik/unit" className="inline-flex items-center gap-2 text-ui font-semibold text-brand-text-muted">
        ← Kembali
      </Link>

      <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-xl border border-brand-border bg-brand-surface p-6 shadow-sm">
        <h2 className="border-b border-brand-border pb-3 text-heading-s font-bold text-brand-text">Tambah Unit Properti Baru</h2>

        {simpan.isError && (
          <p role="alert" className="rounded-md border border-brand-danger-border bg-brand-danger-soft p-3 text-ui text-brand-danger-soft-fg">
            {(simpan.error as Error).message}
          </p>
        )}

        {Object.keys(form.formState.errors).length > 0 && (
          <p role="alert" className="rounded-md bg-brand-surface-sunken p-3 text-ui text-brand-text-muted">
            Ada isian yang perlu diperbaiki: {Object.keys(form.formState.errors).join(', ')}.
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Nama / Judul Unit</Label>
          <Input id="name" aria-invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />
          {form.formState.errors.name && <p className="text-ui text-brand-danger">{form.formState.errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Tipe Properti</Label>
          <select
            id="type"
            aria-invalid={Boolean(form.formState.errors.type)}
            className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-text"
            {...form.register('type')}
          >
            <option value="">Pilih tipe properti</option>
            {TIPE_UNIT.map((tipe) => (
              <option key={tipe} value={tipe}>
                {tipe}
              </option>
            ))}
          </select>
          {form.formState.errors.type && <p className="text-ui text-brand-danger">{form.formState.errors.type.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Lokasi Singkat</Label>
          <Input id="address" aria-invalid={Boolean(form.formState.errors.address)} {...form.register('address')} />
          {form.formState.errors.address && <p className="text-ui text-brand-danger">{form.formState.errors.address.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Harga per Bulan (Rp)</Label>
          <Input id="price" type="number" placeholder="0" aria-invalid={Boolean(form.formState.errors.price)} {...form.register('price', { valueAsNumber: true })} />
          {form.formState.errors.price && <p className="text-ui text-brand-danger">{form.formState.errors.price.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="facilities">Fasilitas (pisahkan dengan koma)</Label>
          <Input id="facilities" placeholder="KM Dalam, Kasur, WiFi, AC" {...form.register('facilities')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Foto unit</Label>
          <input
            id="image"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            aria-label="Foto unit"
            onChange={(e) => {
              const berkas = e.target.files?.[0]
              /* Kosongkan nilai input supaya berkas yang sama bisa dipilih
                 lagi setelah percobaan gagal — tanpa ini peramban tidak
                 memicu `change` untuk berkas yang sama. */
              e.target.value = ''
              pilihFoto(berkas)
            }}
            className="block w-full min-w-0 text-ui text-brand-text-muted file:mr-3 file:h-11 file:rounded-md file:border file:border-brand-border file:bg-brand-surface-sunken file:px-3 file:text-ui file:font-semibold file:text-brand-text"
          />
          {pratinjau && (
            <img src={pratinjau} alt="Pratinjau foto unit" className="h-24 w-32 rounded-lg border border-brand-border object-cover" />
          )}
          {galatFoto && (
            <p role="alert" className="text-ui break-words text-brand-danger">
              {galatFoto}
            </p>
          )}
          {!pratinjau && !galatFoto && <p className="text-ui text-brand-text-subtle">Opsional. Format JPEG, PNG, atau WebP, maksimal 2 MB.</p>}
        </div>

        <Button type="submit" className="w-full" disabled={simpan.isPending || Boolean(galatFoto)}>
          {simpan.isPending ? 'Menyimpan…' : 'Simpan Unit'}
        </Button>
      </form>
    </section>
  )
}
