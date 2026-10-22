import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { useSession } from '@/features/auth/api'
import { writeSession } from '@/features/auth/session'
import { pantauMetode } from '@/test/metode'

function pembungkus() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

/* Mock masih melayani alias lama `/auth/me` selama transisi. Tanpa kunci ini,
   adaptor boleh kembali memanggil `/auth/me` — yang tidak ada di API Laravel —
   dan tes tetap hijau karena mock menjawabnya. */
describe('useSession', () => {
  it('memvalidasi sesi lewat GET /me, bukan alias /auth/me', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    const rekaman = pantauMetode()

    const { result } = renderHook(() => useSession(), { wrapper: pembungkus() })
    await waitFor(() => expect(rekaman).toContain('GET /me'))

    expect(result.current.session?.user.id).toBe(402)
    expect(rekaman.filter((permintaan) => permintaan.includes('/auth/'))).toEqual([])
  })
})
