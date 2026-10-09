import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { useCreateUnit } from '@/features/units/api'
import { unitFormSchema, type UnitFormInput, type UnitFormValues } from '@/features/units/schema'
import { useToast } from '@/ui/toast'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

/* Bidang didaftarkan satu per satu, bukan lewat peta, supaya jenis nilai tiap
   bidang tetap terbaca TypeScript: `price` angka, sisanya teks. */

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
    defaultValues: { name: '', address: '', price: 0, status: 'Tersedia' },
  })

  const onSubmit = form.handleSubmit((nilai) => {
    if (mengirim.current) return
    mengirim.current = true
    simpan.mutate(nilai, {
      onSuccess: () => {
        tampilkan('Unit baru tersimpan dan langsung tayang.', 'success')
        navigate('/pemilik/unit')
      },
      onError: () => {
        mengirim.current = false
      },
    })
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
          <Label htmlFor="address">Lokasi Singkat</Label>
          <Input id="address" aria-invalid={Boolean(form.formState.errors.address)} {...form.register('address')} />
          {form.formState.errors.address && <p className="text-ui text-brand-danger">{form.formState.errors.address.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Harga per Bulan (Rp)</Label>
          <Input id="price" type="number" aria-invalid={Boolean(form.formState.errors.price)} {...form.register('price', { valueAsNumber: true })} />
          {form.formState.errors.price && <p className="text-ui text-brand-danger">{form.formState.errors.price.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={simpan.isPending}>
          {simpan.isPending ? 'Menyimpan…' : 'Simpan Unit'}
        </Button>
      </form>
    </section>
  )
}
