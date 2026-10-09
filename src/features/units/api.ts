import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type { UnitInput, UnitRow } from '@/api/types'
import { useSession } from '@/features/auth/api'
import { parseAmount } from '@/lib/format'

export const unitKeys = {
  list: (userId: number) => ['units', { userId }] as const,
  detail: (id: number) => ['unit', id] as const,
}

function normalisasi(unit: UnitRow): UnitRow {
  return { ...unit, price: parseAmount(unit.price) }
}

export function useUnits() {
  const { session } = useSession()
  const userId = session?.user.id ?? 0
  /* Katalog terbuka untuk pengunjung, jadi kueri tidak menunggu sesi; cakupan
     barisnya tetap ditentukan server dari token. */
  return useQuery({
    queryKey: unitKeys.list(userId),
    queryFn: async (): Promise<UnitRow[]> => {
      const hasil = await apiFetch<{ data: UnitRow[] }>('/units')
      return hasil.data.map(normalisasi)
    },
  })
}

export function useUnit(id: number) {
  return useQuery({
    queryKey: unitKeys.detail(id),
    queryFn: async (): Promise<UnitRow> => {
      const hasil = await apiFetch<{ data: UnitRow }>(`/units/${id}`)
      return normalisasi(hasil.data)
    },
  })
}

export function useCreateUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (nilai: UnitInput) => {
      const hasil = await apiFetch<{ data: UnitRow }>('/units', {
        method: 'POST',
        body: { ...nilai, price: parseAmount(nilai.price) },
      })
      return normalisasi(hasil.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['units'] }),
  })
}

export function useUpdateUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...nilai }: { id: number } & Partial<UnitInput>) => {
      const hasil = await apiFetch<{ data: UnitRow }>(`/units/${id}`, {
        method: 'PATCH',
        body: { ...nilai, price: nilai.price === undefined ? undefined : parseAmount(nilai.price) },
      })
      return normalisasi(hasil.data)
    },
    onSuccess: (_hasil, variabel) => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variabel.id) })
    },
  })
}

export function useUbahStatusUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: UnitRow['status'] }) =>
      apiFetch<{ data: UnitRow }>(`/units/${id}/status`, { method: 'PATCH', body: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['units'] }),
  })
}

export function useDeleteUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/units/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['units'] }),
  })
}
