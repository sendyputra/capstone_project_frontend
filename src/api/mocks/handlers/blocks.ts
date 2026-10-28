import { http, HttpResponse } from 'msw'
import { units } from '@/api/mocks/data/units'
import { pemanggil } from '@/api/mocks/join'
import { tanggalHariIni } from '@/lib/tanggal'
import type { UnitBlockRow } from '@/api/types'

/* Tanggal yang sudah terisi sebelum blok pertama: kontrak aktif dari data
   contoh. Dipakai ulang saat reset supaya `booked_dates` tidak menumpuk. */
const bookedAwal = new Map<number, string[]>(units.map((unit) => [unit.id, [...unit.booked_dates]]))

export const semuaBlok: UnitBlockRow[] = []
let urutan = 0

function unitBy(id: number) {
  return units.find((unit) => unit.id === id)
}

function tanggalAntara(mulai: string, selesai: string): string[] {
  const hasil: string[] = []
  const akhir = Date.parse(`${selesai}T00:00:00Z`)
  for (let waktu = Date.parse(`${mulai}T00:00:00Z`); waktu <= akhir; waktu += 86_400_000) {
    hasil.push(new Date(waktu).toISOString().slice(0, 10))
  }
  return hasil
}

/* `booked_dates` unit = kontrak aktif + blok, seperti accessor backend. */
function sinkron(unitId: number) {
  const unit = unitBy(unitId)
  if (!unit) return
  const diblokir = semuaBlok.filter((blok) => blok.unit_id === unitId).flatMap((blok) => tanggalAntara(blok.start_date, blok.end_date))
  unit.blocked_dates = [...new Set(diblokir)].sort()
  unit.booked_dates = [...new Set([...(bookedAwal.get(unitId) ?? []), ...unit.blocked_dates])].sort()
}

export function resetBlok() {
  semuaBlok.splice(0, semuaBlok.length)
  urutan = 0
  for (const unit of units) {
    unit.blocked_dates = []
    unit.booked_dates = [...(bookedAwal.get(unit.id) ?? [])]
  }
}

export const blockHandlers = [
  http.get('/units/:unit/blocks', ({ request, params }) => {
    const unit = unitBy(Number(params.unit))
    if (!unit) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
    if (pemanggil(request).sub !== unit.owner_id) return HttpResponse.json({ message: 'Unauthorized access' }, { status: 403 })
    const data = semuaBlok.filter((blok) => blok.unit_id === unit.id).sort((a, b) => a.start_date.localeCompare(b.start_date))
    return HttpResponse.json({ data })
  }),

  http.post('/units/:unit/blocks', async ({ request, params }) => {
    const unit = unitBy(Number(params.unit))
    if (!unit) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
    if (pemanggil(request).sub !== unit.owner_id) return HttpResponse.json({ message: 'Unauthorized access' }, { status: 403 })

    const muatan = (await request.json()) as { start_date?: string; end_date?: string; note?: string }
    const { start_date, end_date } = muatan
    if (!start_date || !end_date) return HttpResponse.json({ message: 'Tanggal blokir wajib diisi.' }, { status: 422 })
    if (start_date < tanggalHariIni()) return HttpResponse.json({ message: 'Tanggal blokir tidak boleh di masa lalu.' }, { status: 422 })
    if (end_date < start_date) return HttpResponse.json({ message: 'Tanggal selesai tidak boleh sebelum tanggal mulai.' }, { status: 422 })
    if (unit.booked_dates.some((tanggal) => tanggal >= start_date && tanggal <= end_date)) {
      return HttpResponse.json({ message: 'Tanggal yang dipilih sudah terisi atau diblokir.' }, { status: 422 })
    }

    const block: UnitBlockRow = { id: ++urutan, unit_id: unit.id, start_date, end_date, note: muatan.note ?? '' }
    semuaBlok.push(block)
    sinkron(unit.id)
    return HttpResponse.json({ message: 'Tanggal berhasil diblokir.', block }, { status: 201 })
  }),

  http.delete('/units/:unit/blocks/:block', ({ request, params }) => {
    const unit = unitBy(Number(params.unit))
    if (!unit) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
    if (pemanggil(request).sub !== unit.owner_id) return HttpResponse.json({ message: 'Unauthorized access' }, { status: 403 })

    const indeks = semuaBlok.findIndex((blok) => blok.id === Number(params.block) && blok.unit_id === unit.id)
    if (indeks === -1) return HttpResponse.json({ message: 'Blok tidak ditemukan.' }, { status: 404 })
    semuaBlok.splice(indeks, 1)
    sinkron(unit.id)
    return new HttpResponse(null, { status: 204 })
  }),
]
