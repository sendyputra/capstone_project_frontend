import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { apiDownload, apiFetch } from '@/api/client'
import { ApiError } from '@/api/types'
import { server } from '@/api/mocks/server'
import { readSession, writeSession } from '@/features/auth/session'
import { stubUnduhan } from '@/test/unduh'

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

  it('membuang sesi saat permintaan bertoken dijawab 401', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    server.use(http.get('/percobaan', () => HttpResponse.json({ message: 'Sesi tidak sah.' }, { status: 401 })))
    await apiFetch('/percobaan').catch(() => undefined)
    expect(readSession()).toBeNull()
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

describe('apiDownload', () => {
  it('menyisipkan token dan memakai nama dari Content-Disposition', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    const unduh = stubUnduhan()
    let terlihat: string | null = null
    server.use(
      http.get('/berkas', ({ request }) => {
        terlihat = request.headers.get('Authorization')
        return new HttpResponse('a;b\r\n', {
          headers: {
            'Content-Type': 'text/csv; charset=UTF-8',
            'Content-Disposition': 'attachment; filename="laporan-uji.csv"',
          },
        })
      }),
    )

    await apiDownload('/berkas', 'cadangan.csv')

    expect(terlihat).toBe('Bearer mock.abc.tanda')
    expect(unduh.nama).toEqual(['laporan-uji.csv'])
    expect(unduh.berkas[0].type).toContain('text/csv')
    expect(unduh.revoked).toHaveBeenCalled()
  })

  it('memakai nama cadangan bila Content-Disposition tidak ada', async () => {
    const unduh = stubUnduhan()
    server.use(http.get('/berkas', () => new HttpResponse('a;b\r\n', { headers: { 'Content-Type': 'text/csv' } })))

    await apiDownload('/berkas', 'cadangan.csv')

    expect(unduh.nama).toEqual(['cadangan.csv'])
  })

  it('membuang sesi saat 401', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    stubUnduhan()
    server.use(http.get('/berkas', () => HttpResponse.json({ message: 'Sesi tidak sah.' }, { status: 401 })))

    await apiDownload('/berkas', 'cadangan.csv').catch(() => undefined)

    expect(readSession()).toBeNull()
  })

  it('memetakan 500 menjadi ApiError server', async () => {
    stubUnduhan()
    server.use(http.get('/berkas', () => HttpResponse.json({ message: 'Gagal.' }, { status: 500 })))

    await expect(apiDownload('/berkas', 'cadangan.csv')).rejects.toMatchObject({ kind: 'server', status: 500 })
  })
})
