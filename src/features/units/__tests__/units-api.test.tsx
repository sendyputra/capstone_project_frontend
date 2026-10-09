import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useCreateUnit, useUnits } from '@/features/units/api'
import { writeSession } from '@/features/auth/session'
import type { ReactNode } from 'react'

function pembungkus() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useUnits', () => {
  it('hanya mengembalikan unit milik pemilik yang sedang masuk', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    const { result } = renderHook(() => useUnits(), { wrapper: pembungkus() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(3)
    expect(result.current.data?.every((unit) => unit.owner_id === 402)).toBe(true)
  })

  it('tidak menampilkan unit milik pemilik lain saat token menunjuk pemilik berbeda', async () => {
    const token = `mock.${btoa(JSON.stringify({ sub: 403 }))}.tanda`
    writeSession({ token, user: { id: 403, name: 'Bu Rina', email: 'rina@umkm.id', role: 'pemilik' } })
    const { result } = renderHook(() => useUnits(), { wrapper: pembungkus() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(2)
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
})
