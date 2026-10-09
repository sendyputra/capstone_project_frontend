import { http, HttpResponse } from 'msw'
import { contracts } from '@/api/mocks/data/contracts'
import { payments } from '@/api/mocks/data/payments'
import { tenants } from '@/api/mocks/data/tenants'
import { subDariToken } from '@/api/mocks/token'
import { gagalSekali } from '@/api/mocks/handlers/simulasi'
import { labelBulan, penggunaById, unitById } from '@/api/mocks/join'
import type { Contract, Payment, PaymentRow } from '@/api/types'

function kontrakDari(pembayaran: Payment): Contract | undefined {
  return contracts.find((kontrak) => kontrak.id === pembayaran.contract_id)
}

export function barisTagihan(pembayaran: Payment): PaymentRow {
  const kontrak = kontrakDari(pembayaran)
  const tenant = kontrak ? tenants.find((kandidat) => kandidat.id === kontrak.tenant_id) : undefined
  const unit = kontrak ? unitById(kontrak.unit_id) : undefined
  return { ...pembayaran, month: labelBulan(pembayaran.month), renter_name: tenant?.name ?? '', unit_title: unit?.name ?? '' }
}

export const paymentHandlers = [
  http.get('/payments', ({ request }) => {
    const sub = subDariToken(request.headers.get('Authorization')) ?? 402
    const peran = penggunaById(sub)?.role

    /* Cakupan dari peran token: penyewa hanya tagihannya, pemilik tagihan unit
       miliknya, admin seluruhnya. */
    if (peran === 'penyewa') {
      const milik = payments.filter((pembayaran) => {
        const kontrak = kontrakDari(pembayaran)
        return tenants.find((tenant) => tenant.id === kontrak?.tenant_id)?.user_id === sub
      })
      return HttpResponse.json({ data: milik.map(barisTagihan) })
    }
    if (peran === 'pemilik') {
      const milik = payments.filter((pembayaran) => unitById(kontrakDari(pembayaran)?.unit_id ?? 0)?.owner_id === sub)
      return HttpResponse.json({ data: milik.map(barisTagihan) })
    }
    return HttpResponse.json({ data: payments.map(barisTagihan) })
  }),

  http.post('/payments/:id/proof', async ({ params, request }) => {
    const pembayaran = payments.find((kandidat) => kandidat.id === Number(params.id))
    if (!pembayaran) return HttpResponse.json({ message: 'Tagihan tidak ditemukan.' }, { status: 404 })
    if (gagalSekali('POST /payments/proof')) {
      return HttpResponse.json({ message: 'Bukti bayar gagal diunggah karena koneksi terputus. Periksa jaringan, lalu coba lagi.' }, { status: 500 })
    }
    const { proof_url } = (await request.json()) as Pick<Payment, 'proof_url'>
    pembayaran.proof_url = proof_url
    pembayaran.status = 'Menunggu Verifikasi'
    return HttpResponse.json({ data: barisTagihan(pembayaran) })
  }),

  http.patch('/payments/:id', async ({ params, request }) => {
    const pembayaran = payments.find((kandidat) => kandidat.id === Number(params.id))
    if (!pembayaran) return HttpResponse.json({ message: 'Tagihan tidak ditemukan.' }, { status: 404 })
    const { status } = (await request.json()) as Pick<Payment, 'status'>
    pembayaran.status = status
    if (status === 'Ditolak') pembayaran.proof_url = ''
    return HttpResponse.json({ data: barisTagihan(pembayaran) })
  }),
]
