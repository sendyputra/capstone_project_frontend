import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { halamanLaravel } from '@/api/mocks/halaman'
import { server } from '@/api/mocks/server'
import { writeSession } from '@/features/auth/session'
import { usePayments, useUnggahBukti } from '@/features/billing/api'

function pembungkus() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

/* Badan multipart dibaca di handler lalu diratakan menjadi nilai biasa: kelas
   `File` yang dibuat parser multipart berbeda realm dari kelas jsdom, jadi
   dibandingkan lewat nama dan tipenya, bukan lewat identitas objek. */
type Terkirim = {
  bagian: string[]
  contract_id: string | null
  month: string | null
  amount: string | null
  proof_nama: string
  proof_tipe: string
}

describe('useUnggahBukti', () => {
  it('mengirim bukti bayar sebagai multipart ke POST /payments', async () => {
    const terkirim: Terkirim[] = []
    server.use(
      http.post('/payments', async ({ request }) => {
        const badan = await request.formData()
        const berkas = badan.get('proof')
        terkirim.push({
          bagian: [...badan.keys()].sort(),
          contract_id: badan.get('contract_id') as string | null,
          month: badan.get('month') as string | null,
          amount: badan.get('amount') as string | null,
          proof_nama: typeof berkas === 'string' ? berkas : (berkas?.name ?? ''),
          proof_tipe: typeof berkas === 'string' ? '' : (berkas?.type ?? ''),
        })
        return HttpResponse.json({ data: { id: 999 } }, { status: 201 })
      }),
    )

    const { result } = renderHook(() => useUnggahBukti(), { wrapper: pembungkus() })
    const proof = new File(['isi bukti'], 'bukti-nov.jpg', { type: 'image/jpeg' })

    result.current.mutate({ contract_id: 205, month: '2026-11', amount: 2_500_000, proof })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    /* Nilai angka dan id dikirim sebagai teks: `FormData` tidak mengenal tipe,
       dan backend Laravel memvalidasinya sebagai string/berkas. */
    expect(terkirim).toEqual([
      {
        bagian: ['amount', 'contract_id', 'month', 'proof'],
        contract_id: '205',
        month: '2026-11',
        amount: '2500000',
        proof_nama: 'bukti-nov.jpg',
        proof_tipe: 'image/jpeg',
      },
    ])
  })
})

describe('usePayments', () => {
  /* Backend sungguhan memaginasi 10 baris per halaman. Sebelum klien mengikuti
     `last_page`, tagihan bulan lama tidak terbaca dan dashboard melaporkannya
     sebagai belum dibayar. */
  it('menggabungkan seluruh halaman /payments', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    const semua = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      contract_id: 1,
      month: '2026-01',
      amount: 1_800_000,
      status: 'paid',
      proof_url: '',
    }))
    server.use(http.get('/payments', ({ request }) => halamanLaravel(request, semua)))

    const { result } = renderHook(() => usePayments(), { wrapper: pembungkus() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(25)
  })
})
