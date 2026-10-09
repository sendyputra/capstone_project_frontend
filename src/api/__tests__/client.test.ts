import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { apiFetch } from '@/api/client'
import { ApiError } from '@/api/types'
import { server } from '@/api/mocks/server'
import { writeSession } from '@/features/auth/session'

describe('apiFetch', () => {
  it('menyisipkan token dari sesi', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    let terlihat: string | null = null
    server.use(
      http.get('/percobaan', ({ request }) => {
        terlihat = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )
    await apiFetch('/percobaan')
    expect(terlihat).toBe('Bearer mock.abc.tanda')
  })

  it('memetakan 422 menjadi galat isian per bidang', async () => {
    server.use(
      http.post('/percobaan', () =>
        HttpResponse.json({ message: 'Periksa isian.', errors: { name: 'Nama unit belum diisi.' } }, { status: 422 }),
      ),
    )
    await expect(apiFetch('/percobaan', { method: 'POST', body: {} })).rejects.toMatchObject({
      kind: 'validation',
      fields: { name: 'Nama unit belum diisi.' },
    })
  })

  it('memetakan 401 menjadi galat sesi', async () => {
    server.use(http.get('/percobaan', () => HttpResponse.json({ message: 'Sesi tidak sah.' }, { status: 401 })))
    const galat = (await apiFetch('/percobaan').catch((e: unknown) => e)) as ApiError
    expect(galat).toBeInstanceOf(ApiError)
    expect(galat.kind).toBe('unauthorized')
  })

  it('memetakan 500 menjadi galat server yang bisa diulang', async () => {
    server.use(http.get('/percobaan', () => HttpResponse.json({ message: 'Koneksi terputus.' }, { status: 500 })))
    await expect(apiFetch('/percobaan')).rejects.toMatchObject({ kind: 'server', status: 500 })
  })

  it('memetakan kegagalan jaringan menjadi galat jaringan', async () => {
    server.use(http.get('/percobaan', () => HttpResponse.error()))
    await expect(apiFetch('/percobaan')).rejects.toMatchObject({ kind: 'network' })
  })
})
