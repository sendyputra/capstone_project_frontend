import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/api/mocks/server'
import { useCreateUnit, useMyUnits, usePublicUnits, useUbahStatusUnit, useUnit } from '@/features/units/api'
import { pantauMetode } from '@/test/metode'
import { writeSession } from '@/features/auth/session'
import type { ReactNode } from 'react'

function pembungkus() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

/* Adendum butir 1: katalog dan detailnya dibaca dari jalur publik, supaya
   pengunjung tanpa token bisa membuka `/katalog` dan `/katalog/:id`. Mock
   melayani jalur privat maupun publik, jadi tanpa kunci ini adaptor boleh
   kembali ke `/units` dan `/units/:id` — yang menolak 401 di API asli — tanpa
   satu tes pun merah. */
describe('jalur publik unit', () => {
  it('usePublicUnits memanggil GET /list/units tanpa sesi', async () => {
    const rekaman = pantauMetode()
    const { result } = renderHook(() => usePublicUnits(), { wrapper: pembungkus() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(rekaman).toContain('GET /list/units')
  })

  it('useUnit memanggil GET /detail/unit/:id', async () => {
    const rekaman = pantauMetode()
    const { result } = renderHook(() => useUnit(1), { wrapper: pembungkus() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(rekaman).toContain('GET /detail/unit/1')
  })
})

describe('useMyUnits', () => {
  it('hanya mengembalikan unit milik pemilik yang sedang masuk', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    const { result } = renderHook(() => useMyUnits(), { wrapper: pembungkus() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(6)
    expect(result.current.data?.every((unit) => unit.owner_id === 402)).toBe(true)
  })

  /* API tanpa parameter `status` hanya mengembalikan unit `available`; unit
     yang sedang disewa atau dirawat hilang dari layar pemilik. */
  it('meminta semua status unit, bukan hanya yang tersedia', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    const rekaman = pantauMetode()
    const { result } = renderHook(() => useMyUnits(), { wrapper: pembungkus() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(rekaman).toContain('GET /units?status=all')
  })

  it('tidak menampilkan unit milik pemilik lain saat token menunjuk pemilik berbeda', async () => {
    const token = `mock.${btoa(JSON.stringify({ sub: 403 }))}.tanda`
    writeSession({ token, user: { id: 403, name: 'Bu Rina', email: 'rina@umkm.id', role: 'pemilik' } })
    const { result } = renderHook(() => useMyUnits(), { wrapper: pembungkus() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(5)
    expect(result.current.data?.every((unit) => unit.owner_id === 403)).toBe(true)
  })
})

describe('useCreateUnit', () => {
  it('menormalkan harga berbentuk string desimal dari formulir', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    const { result } = renderHook(() => useCreateUnit(), { wrapper: pembungkus() })
    result.current.mutate({ name: 'Kos Kamar 09', address: 'Bandung', price: '1200000.00' as unknown as number, status: 'Tersedia' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.price).toBe(1200000)
  })

  /* Formulir memakai label tampilan; yang berangkat ke API harus enum backend.
     Tanpa kunci ini, `status: 'Tersedia'` bisa kembali terkirim dan baru ketahuan
     di backend asli. */
  it('mengirim enum backend, bukan label tampilan', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    const terkirim: unknown[] = []
    server.use(
      http.post('/units', async ({ request }) => {
        terkirim.push(await request.json())
        return HttpResponse.json({ data: { id: 99 } }, { status: 201 })
      }),
    )
    const { result } = renderHook(() => useCreateUnit(), { wrapper: pembungkus() })
    result.current.mutate({ name: 'Kos Kamar 09', address: 'Bandung', price: 1200000, status: 'Perawatan' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(terkirim).toEqual([{ name: 'Kos Kamar 09', address: 'Bandung', price: 1200000, status: 'maintenance' }])
  })

  /* API asli membalas `{message, unit}`, bukan `{data: …}`. Tanpa pembuka
     beramplop, hasil mutasi terbaca sebagai objek tanpa `id` dan layar
     menampilkan baris kosong setelah simpan. */
  it('membaca amplop `unit` dari API asli', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    server.use(
      http.post('/units', () =>
        HttpResponse.json(
          { message: 'Unit berhasil disimpan.', unit: { id: 77, owner_id: 402, name: 'Kos Baru', price: 900000, status: 'available' } },
          { status: 201 },
        ),
      ),
    )
    const { result } = renderHook(() => useCreateUnit(), { wrapper: pembungkus() })
    result.current.mutate({ name: 'Kos Baru', address: 'Bandung', price: 900000, status: 'Tersedia' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(77)
  })
})

describe('useUbahStatusUnit', () => {
  it('membaca amplop `unit` dari API asli', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    server.use(
      http.patch('/units/1/status', () =>
        HttpResponse.json({ message: 'Status unit berhasil diperbarui.', unit: { id: 1, name: 'Kos Kamar 01', status: 'maintenance' } }),
      ),
    )
    const { result } = renderHook(() => useUbahStatusUnit(), { wrapper: pembungkus() })
    result.current.mutate({ id: 1, status: 'Perawatan' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toMatchObject({ id: 1, status: 'Perawatan' })
  })
})
