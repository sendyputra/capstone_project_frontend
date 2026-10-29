import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { apiDownload, apiFetch, apiSemuaHalaman, urlAset } from '@/api/client'
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

  /* Backend menjawab 403 "Unauthorized access" saat peran atau kepemilikan
     ditolak. Sesi masih sah, jadi 403 tidak boleh diperlakukan seperti 401. */
  it('tidak membuang sesi saat 403 dan memakai galat terlarang', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    server.use(http.get('/percobaan', () => HttpResponse.json({ message: 'Unauthorized access' }, { status: 403 })))

    const galat = (await apiFetch('/percobaan').catch((e: unknown) => e)) as ApiError

    expect(galat.kind).toBe('forbidden')
    expect(readSession()).not.toBeNull()
  })

  /* Balasan 2xx yang bukan JSON (halaman HTML proxy, badan kosong) harus tetap
     menjadi ApiError, bukan SyntaxError mentah yang tidak punya `kind`. */
  it('membungkus balasan 2xx non-JSON sebagai galat server', async () => {
    server.use(http.get('/percobaan', () => new HttpResponse('<html>gerbang</html>', { headers: { 'Content-Type': 'text/html' } })))

    await expect(apiFetch('/percobaan')).rejects.toMatchObject({ kind: 'server', status: 200 })
  })
})

/* Backend memaginasi 10 baris per halaman. Daftar yang dipakai layar harus
   utuh, jadi halaman diikuti sampai `last_page` — kalau tidak, tagihan bulan
   lama tidak terlihat dan dashboard melaporkannya sebagai belum dibayar. */
describe('apiSemuaHalaman', () => {
  it('mengikuti seluruh halaman dan menggabungkan barisnya', async () => {
    server.use(
      http.get('/percobaan', ({ request }) => {
        const halaman = Number(new URL(request.url).searchParams.get('page') ?? 1)
        return HttpResponse.json({
          current_page: halaman,
          last_page: 2,
          data: halaman === 1 ? [{ id: 1 }, { id: 2 }] : [{ id: 3 }],
        })
      }),
    )

    await expect(apiSemuaHalaman('/percobaan')).resolves.toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
  })

  it('berhenti di satu halaman bila server tidak memaginasi', async () => {
    let panggilan = 0
    server.use(
      http.get('/percobaan', () => {
        panggilan += 1
        return HttpResponse.json({ data: [{ id: 1 }] })
      }),
    )

    await expect(apiSemuaHalaman('/percobaan')).resolves.toEqual([{ id: 1 }])
    expect(panggilan).toBe(1)
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

  /* Laravel `streamDownload` mengirim nama berkas tanpa kutip, jadi cabang
     tanpa kutip di `apiDownload` juga harus terbaca. */
  it('membaca nama berkas tanpa kutip', async () => {
    const unduh = stubUnduhan()
    server.use(
      http.get(
        '/berkas',
        () =>
          new HttpResponse('a;b\r\n', {
            headers: {
              'Content-Type': 'text/csv; charset=UTF-8',
              'Content-Disposition': 'attachment; filename=laporan-uji.csv',
            },
          }),
      ),
    )

    await apiDownload('/berkas', 'cadangan.csv')

    expect(unduh.nama).toEqual(['laporan-uji.csv'])
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

describe('urlAset', () => {
  it('melengkapi jalur unggahan dengan origin API', () => {
    expect(urlAset('/uploads/demo/kos-a.jpg', 'http://localhost:8555')).toBe(
      'http://localhost:8555/uploads/demo/kos-a.jpg',
    )
  })

  /* Gambar MSW tinggal di `public/demo/` frontend, jadi jangan ikut ditempeli
     origin API. URL absolut juga sudah lengkap. */
  it('membiarkan URL absolut dan aset non-unggahan', () => {
    expect(urlAset('https://cdn.example/kos.jpg', 'http://localhost:8555')).toBe('https://cdn.example/kos.jpg')
    expect(urlAset('/demo/kos.jpg', 'http://localhost:8555')).toBe('/demo/kos.jpg')
  })
})
