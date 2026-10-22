import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dariStatusBayar, keDaftarPembayaran, kePembayaran } from '@/api/adapters/payments'
import { apiFetch, buka } from '@/api/client'
import type { PaymentRow } from '@/api/types'
import { useSession } from '@/features/auth/api'

export const paymentKeys = { list: (userId: number) => ['payments', { userId }] as const }

export function usePayments() {
  const { session } = useSession()
  const userId = session?.user.id ?? 0
  return useQuery({
    queryKey: paymentKeys.list(userId),
    enabled: Boolean(session),
    queryFn: async (): Promise<PaymentRow[]> => keDaftarPembayaran(await apiFetch<unknown>('/payments')),
  })
}

/* Unggah bukti bayar membuat baris pembayaran baru: backend tidak punya rute
   ubah-bukti, jadi `POST /payments` dengan `multipart/form-data` adalah satu-
   satunya jalan. `Belum Bayar` di layar berarti belum ada baris sama sekali. */
export function useUnggahBukti() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (masukan: { contract_id: number; month: string; amount: number; proof: File }) => {
      const badan = new FormData()
      badan.set('contract_id', String(masukan.contract_id))
      badan.set('month', masukan.month)
      badan.set('amount', String(masukan.amount))
      badan.set('proof', masukan.proof)
      /* `apiFetch` tidak memaksa `Content-Type` untuk FormData: batas multipart
         harus disusun peramban sendiri. */
      return apiFetch<{ data: unknown }>('/payments', { method: 'POST', body: badan })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })
}

export function useVerifikasiPembayaran() {
  const queryClient = useQueryClient()
  return useMutation({
    /* `Lunas`/`Ditolak` dari halaman diterjemahkan ke `paid`/`rejected`. */
    mutationFn: async ({ id, status }: { id: number; status: PaymentRow['status'] }) =>
      kePembayaran(buka(await apiFetch<unknown>(`/payments/${id}`, { method: 'PUT', body: { status: dariStatusBayar(status) } }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })
}
