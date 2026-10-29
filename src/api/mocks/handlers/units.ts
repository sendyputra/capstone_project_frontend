import { http, HttpResponse, type HttpResponseResolver } from 'msw'
import { units, type UnitDto } from '@/api/mocks/data/units'
import { gagalSekali } from '@/api/mocks/handlers/simulasi'
import { halamanLaravel } from '@/api/mocks/halaman'
import { barisUnit, pemanggil, subPemanggil } from '@/api/mocks/join'

let urutan = units.length

/* POST dan PUT /units menerima JSON maupun multipart: formulir tambah unit
   memakai FormData karena berkas foto ikut terkirim. Bagian berkas diperiksa
   dari bentuknya, bukan lewat `instanceof File` — kelas `File` di jsdom berbeda
   realm dari kelas yang dipakai parser multipart, pembatasan yang sama dengan
   handler pembayaran. */
async function muatanUnitDto(request: Request): Promise<Partial<UnitDto>> {
  if ((request.headers.get('content-type') ?? '').includes('application/json')) {
    return (await request.json()) as Partial<UnitDto>
  }
  const badan = await request.formData()
  const berkas = badan.get('image')
  const teks = (nama: string) => String(badan.get(nama) ?? '')
  /* Butir yang tidak ikut tertulis ke `undefined`, bukan 0/'' — PUT sebagian
     bekerja lewat `Object.assign`, jadi bidang yang absen tidak boleh menimpa
     nilai lama. POST memakai `??` di pematangan barisnya sendiri. */
  return {
    ...(badan.has('name') ? { name: teks('name') } : {}),
    ...(badan.has('address') ? { address: teks('address') } : {}),
    ...(badan.has('price') ? { price: Number(teks('price')) } : {}),
    ...(badan.has('status') ? { status: teks('status') as UnitDto['status'] } : {}),
    ...(badan.has('type') ? { type: teks('type') as UnitDto['type'] } : {}),
    ...(badan.has('facilities[]') ? { facilities: badan.getAll('facilities[]').map(String) } : {}),
    ...(berkas !== null && typeof berkas !== 'string' ? { image: `/demo/${berkas.name}` } : badan.has('image') ? { image: teks('image') } : {}),
  }
}

const ubahUnit: HttpResponseResolver<{ id: string }> = async ({ params, request }) => {
  const unit = units.find((kandidat) => kandidat.id === Number(params.id))
  if (!unit) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
  const muatan = await muatanUnitDto(request)
  Object.assign(unit, muatan, { price: muatan.price === undefined ? unit.price : Number(muatan.price) })
  return HttpResponse.json({ data: barisUnit(unit) })
}

export const unitHandlers = [
  /* Cakupan dibaca dari token, seperti backend asli: pemilik hanya unitnya,
     sedangkan pengunjung dan penyewa melihat seluruh unit lintas pemilik. */
  http.get('/units', ({ request }) => {
    const { sub, peran } = pemanggil(request)
    const data = peran === 'pemilik' ? units.filter((unit) => unit.owner_id === sub) : units
    return halamanLaravel(request, data.map(barisUnit))
  }),

  /* Katalog publik: seluruh unit lintas pemilik, tanpa pemeriksaan token. */
  http.get('/list/units', () => HttpResponse.json({ data: units.map(barisUnit) })),

  /* Detail publik untuk `/katalog/:id`: pengunjung tanpa token harus bisa
     membuka satu unit. Pemetaan barisnya sama dengan `/units/:id` — bedanya
     hanya tidak ada token yang dibaca. */
  http.get('/detail/unit/:id', ({ params }) => {
    const unit = units.find((kandidat) => kandidat.id === Number(params.id))
    if (!unit) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
    return HttpResponse.json({ data: barisUnit(unit) })
  }),

  /* Detail jalur pemilik dipertahankan: `GET /units/:id` tetap dilayani untuk
     klien yang membawa token (dan untuk tes jalur privat). */
  http.get('/units/:id', ({ params }) => {
    const unit = units.find((kandidat) => kandidat.id === Number(params.id))
    if (!unit) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
    return HttpResponse.json({ data: barisUnit(unit) })
  }),

  http.post('/units', async ({ request }) => {
    const muatan = await muatanUnitDto(request)
    if (gagalSekali('POST /units')) {
      return HttpResponse.json({ message: 'Unit gagal disimpan karena koneksi terputus.' }, { status: 500 })
    }
    if (!muatan.name || !muatan.name.trim()) {
      return HttpResponse.json(
        { message: 'Periksa isian.', errors: { name: 'Nama unit belum diisi. Isi nama agar penyewa mudah mengenali unit ini.' } },
        { status: 422 },
      )
    }
    const unit: UnitDto = {
      id: ++urutan,
      owner_id: subPemanggil(request),
      name: muatan.name,
      address: muatan.address ?? '',
      price: Number(muatan.price ?? 0),
      status: muatan.status ?? 'available',
      type: muatan.type ?? 'Kamar Kos',
      facilities: muatan.facilities ?? [],
      image: muatan.image ?? '/demo/kos.jpg',
      booked_dates: [],
      blocked_dates: [],
    }
    units.push(unit)
    return HttpResponse.json({ data: barisUnit(unit) }, { status: 201 })
  }),

  http.patch('/units/:id/status', async ({ params, request }) => {
    const unit = units.find((kandidat) => kandidat.id === Number(params.id))
    if (!unit) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
    const { status } = (await request.json()) as Pick<UnitDto, 'status'>
    unit.status = status
    return HttpResponse.json({ data: barisUnit(unit) })
  }),

  /* `useUpdateUnit` mengirim PUT; mock hanya melayani PUT supaya adaptor yang
     kembali ke PATCH gagal di sini, bukan diam-diam lolos. */
  http.put('/units/:id', ubahUnit),

  http.delete('/units/:id', ({ params }) => {
    if (gagalSekali('DELETE /units')) {
      return HttpResponse.json({ message: 'Unit gagal dihapus karena koneksi terputus.' }, { status: 500 })
    }
    const indeks = units.findIndex((kandidat) => kandidat.id === Number(params.id))
    if (indeks === -1) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
    units.splice(indeks, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
