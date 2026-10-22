import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { keDaftarKontrak, keKontrak } from '@/api/adapters/contracts'
import { apiFetch, buka } from '@/api/client'
import type { ContractRow } from '@/api/types'

export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async (): Promise<ContractRow[]> => keDaftarKontrak(await apiFetch<unknown>('/contracts')),
  })
}

export function useBuatKontrak() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (masukan: { unit_id: number; start_date: string; end_date: string; total_price: number }) =>
      /* Jawaban server dilewatkan adaptor seperti daftar: pemanggil menerima
         baris siap tampil, bukan DTO mentah yang bentuknya lain. */
      keKontrak(buka(await apiFetch<unknown>('/contracts', { method: 'POST', body: masukan }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  })
}

export function useUbahStatusKontrak() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: ContractRow['status'] }) =>
      keKontrak(buka(await apiFetch<unknown>(`/contracts/${id}`, { method: 'PUT', body: { status } }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  })
}
