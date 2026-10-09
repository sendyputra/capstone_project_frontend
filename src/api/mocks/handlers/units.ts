import { http, HttpResponse } from 'msw'
import { units } from '@/api/mocks/data/units'
import { subDariToken } from '@/api/mocks/token'
import { gagalSekali } from '@/api/mocks/handlers/simulasi'
import { barisUnit, penggunaById } from '@/api/mocks/join'
import type { Unit } from '@/api/types'

/* Pemilik pertama pada data contoh; dipakai hanya bila token tidak membawa sub
   yang bisa dibaca (mis. token uji yang dipalsukan). */
const PEMILIK_BAWAAN = 402

let urutan = units.length

function subPemanggil(otorisasi: string | null) {
  return subDariToken(otorisasi) ?? PEMILIK_BAWAAN
}

export const unitHandlers = [
  http.get('/units', ({ request }) => {
    const sub = subPemanggil(request.headers.get('Authorization'))
    const peran = penggunaById(sub)?.role

    /* Cakupan dibaca dari token, seperti backend asli: pemilik hanya unitnya,
       sedangkan katalog penyewa dan panel admin melihat seluruh unit lintas
       pemilik — purwarupa menampilkan lencana status di katalog. */
    let data = units
    if (peran === 'pemilik') data = units.filter((unit) => unit.owner_id === sub)

    return HttpResponse.json({ data: data.map(barisUnit) })
  }),

  http.get('/units/:id', ({ params }) => {
    const unit = units.find((kandidat) => kandidat.id === Number(params.id))
    if (!unit) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
    return HttpResponse.json({ data: barisUnit(unit) })
  }),

  http.post('/units', async ({ request }) => {
    const muatan = (await request.json()) as Partial<Unit>
    if (gagalSekali('POST /units')) {
      return HttpResponse.json({ message: 'Unit gagal disimpan karena koneksi terputus.' }, { status: 500 })
    }
    if (!muatan.name || !muatan.name.trim()) {
      return HttpResponse.json(
        { message: 'Periksa isian.', errors: { name: 'Nama unit belum diisi. Isi nama agar penyewa mudah mengenali unit ini.' } },
        { status: 422 },
      )
    }
    const unit: Unit = {
      id: ++urutan,
      owner_id: subPemanggil(request.headers.get('Authorization')),
      name: muatan.name,
      address: muatan.address ?? '',
      price: Number(muatan.price ?? 0),
      status: muatan.status ?? 'Tersedia',
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
    const { status } = (await request.json()) as Pick<Unit, 'status'>
    unit.status = status
    return HttpResponse.json({ data: barisUnit(unit) })
  }),

  http.patch('/units/:id', async ({ params, request }) => {
    const unit = units.find((kandidat) => kandidat.id === Number(params.id))
    if (!unit) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
    const muatan = (await request.json()) as Partial<Unit>
    Object.assign(unit, muatan, { price: muatan.price === undefined ? unit.price : Number(muatan.price) })
    return HttpResponse.json({ data: barisUnit(unit) })
  }),

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
