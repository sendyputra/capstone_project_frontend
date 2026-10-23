import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { apiFetch, buka } from '@/api/client'
import { server } from '@/api/mocks/server'

describe('buka', () => {
  it('membuka amplop data', () => {
    expect(buka<number[]>({ data: [1, 2] })).toEqual([1, 2])
  })

  it('menerima nilai langsung', () => {
    expect(buka<number[]>([1, 2])).toEqual([1, 2])
  })
})

describe('apiFetch FormData', () => {
  it('tidak memasang header JSON dan mengirim multipart', async () => {
    let tipe: string | null = 'belum'
    server.use(
      http.post('/payments', ({ request }) => {
        tipe = request.headers.get('Content-Type')
        return HttpResponse.json({ data: { id: 1 } }, { status: 201 })
      }),
    )
    const badan = new FormData()
    badan.set('month', '2026-10')
    await apiFetch('/payments', { method: 'POST', body: badan })
    expect(tipe).toContain('multipart/form-data')
  })

  it('mengisi fields dari galat 422', async () => {
    server.use(
      http.post('/units', () =>
        HttpResponse.json({ message: 'Periksa isian.', errors: { name: ['Nama wajib diisi.'] } }, { status: 422 }),
      ),
    )
    await expect(apiFetch('/units', { method: 'POST', body: {} })).rejects.toMatchObject({
      message: 'Periksa isian.',
      kind: 'validation',
      fields: { name: 'Nama wajib diisi.' },
    })
  })
})
