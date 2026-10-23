import { http, HttpResponse, type HttpResponseResolver } from 'msw'
import { units, type UnitDto } from '@/api/mocks/data/units'
import { gagalSekali } from '@/api/mocks/handlers/simulasi'
import { barisUnit, pemanggil, subPemanggil } from '@/api/mocks/join'

let urutan = units.length

const ubahUnit: HttpResponseResolver<{ id: string }> = async ({ params, request }) => {
  const unit = units.find((kandidat) => kandidat.id === Number(params.id))
  if (!unit) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
  const muatan = (await request.json()) as Partial<UnitDto>
  Object.assign(unit, muatan, { price: muatan.price === undefined ? unit.price : Number(muatan.price) })
  return HttpResponse.json({ data: barisUnit(unit) })
}

export const unitHandlers = [
  /* Cakupan dibaca dari token, seperti backend asli: pemilik hanya unitnya,
     sedangkan pengunjung dan penyewa melihat seluruh unit lintas pemilik. */
  http.get('/units', ({ request }) => {
    const { sub, peran } = pemanggil(request)
    const data = peran === 'pemilik' ? units.filter((unit) => unit.owner_id === sub) : units
    return HttpResponse.json({ data: data.map(barisUnit) })
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
    const muatan = (await request.json()) as Partial<UnitDto>
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
