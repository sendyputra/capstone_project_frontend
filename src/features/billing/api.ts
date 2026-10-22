import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { keDaftarPembayaran, kePembayaran } from '@/api/adapters/payments'
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

export function useUnggahBukti() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, proof_url }: { id: number; proof_url: string }) =>
      apiFetch<{ data: PaymentRow }>(`/payments/${id}/proof`, { method: 'POST', body: { proof_url } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })
}

export function useVerifikasiPembayaran() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: PaymentRow['status'] }) =>
      kePembayaran(buka(await apiFetch<unknown>(`/payments/${id}`, { method: 'PUT', body: { status } }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })
}
