import { http, HttpResponse } from 'msw'
import { contracts } from '@/api/mocks/data/contracts'
import { namaPengguna, tenantById, termBulan, unitById } from '@/api/mocks/join'
import type { Contract, ContractRow } from '@/api/types'

export function barisKontrak(kontrak: Contract): ContractRow {
  const unit = unitById(kontrak.unit_id)
  return {
    ...kontrak,
    renter_name: tenantById(kontrak.tenant_id)?.name ?? 'Tanpa penyewa',
    unit_title: unit?.name ?? 'Unit terhapus',
    owner_name: unit ? namaPengguna(unit.owner_id) : 'Tanpa pemilik',
    term: termBulan(kontrak.start_date, kontrak.end_date),
    monthly: unit?.price ?? 0,
  }
}

export const contractHandlers = [
  http.get('/contracts', () => HttpResponse.json({ data: contracts.map(barisKontrak) })),

  http.patch('/contracts/:id', async ({ params, request }) => {
    const kontrak = contracts.find((kandidat) => kandidat.id === Number(params.id))
    if (!kontrak) return HttpResponse.json({ message: 'Kontrak tidak ditemukan.' }, { status: 404 })
    const { status } = (await request.json()) as Pick<Contract, 'status'>
    kontrak.status = status
    return HttpResponse.json({ data: barisKontrak(kontrak) })
  }),
]
