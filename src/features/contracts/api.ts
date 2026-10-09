import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type { ContractRow } from '@/api/types'

export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async (): Promise<ContractRow[]> => {
      const hasil = await apiFetch<{ data: ContractRow[] }>('/contracts')
      return hasil.data
    },
  })
}

export function useUbahStatusKontrak() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ContractRow['status'] }) =>
      apiFetch<{ data: ContractRow }>(`/contracts/${id}`, { method: 'PATCH', body: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  })
}
