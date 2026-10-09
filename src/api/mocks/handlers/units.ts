import { http, HttpResponse } from 'msw'
import { units } from '@/api/mocks/data/units'
import { subDariToken } from '@/api/mocks/token'
import type { Unit } from '@/api/types'

/* Pemilik pertama pada data contoh; dipakai hanya bila token tidak membawa sub
   yang bisa dibaca (mis. token uji yang dipalsukan). */
const PEMILIK_BAWAAN = 402

/* Kegagalan disimulasikan sekali per kombinasi aksi supaya jalur galat dan
   tombol coba ulang bisa didemokan tanpa backend — sama seperti purwarupa.
   Simulasi default mati supaya tes jalur berhasil tidak ikut gagal; peramban
   menyalakannya lewat `aktifkanSimulasi()` saat worker mock menyala, dan tes
   yang memang ingin kegagalan pertama menyalakannya sendiri. */
let simulasiAktif = false
const sudahGagal = new Set<string>()

function gagalSekali(kunci: string) {
  if (!simulasiAktif) return false
  if (sudahGagal.has(kunci)) return false
  sudahGagal.add(kunci)
  return true
}

export function aktifkanSimulasi() {
  simulasiAktif = true
}

export function resetSimulasi() {
  sudahGagal.clear()
  simulasiAktif = false
}

let urutan = units.length

export const unitHandlers = [
  http.get('/units', ({ request }) => {
    /* Peran dibaca dari token: pemilik hanya menerima unitnya sendiri.
       Ini juga yang menahan kebocoran unit milik pemilik lain. */
    const pemilik = subDariToken(request.headers.get('Authorization')) ?? PEMILIK_BAWAAN
    return HttpResponse.json({ data: units.filter((unit) => unit.owner_id === pemilik) })
  }),

  http.get('/units/:id', ({ params }) => {
    const unit = units.find((kandidat) => kandidat.id === Number(params.id))
    if (!unit) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
    return HttpResponse.json({ data: unit })
  }),

  http.post('/units', async ({ request }) => {
    const muatan = (await request.json()) as Omit<Unit, 'id' | 'owner_id'>
    if (gagalSekali('POST /units')) {
      return HttpResponse.json({ message: 'Unit gagal disimpan karena koneksi terputus.' }, { status: 500 })
    }
    if (!muatan.name || !muatan.name.trim()) {
      return HttpResponse.json(
        { message: 'Periksa isian.', errors: { name: 'Nama unit belum diisi. Isi nama agar penyewa mudah mengenali unit ini.' } },
        { status: 422 },
      )
    }
    const unit: Unit = { id: ++urutan, owner_id: subDariToken(request.headers.get('Authorization')) ?? PEMILIK_BAWAAN, ...muatan, price: Number(muatan.price) }
    units.push(unit)
    return HttpResponse.json({ data: unit }, { status: 201 })
  }),

  http.patch('/units/:id', async ({ params, request }) => {
    const unit = units.find((kandidat) => kandidat.id === Number(params.id))
    if (!unit) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
    const muatan = (await request.json()) as Partial<Unit>
    Object.assign(unit, muatan, { price: muatan.price === undefined ? unit.price : Number(muatan.price) })
    return HttpResponse.json({ data: unit })
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
