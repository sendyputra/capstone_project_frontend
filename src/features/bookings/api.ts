import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type { BookingRow } from '@/api/types'
import { useSession } from '@/features/auth/api'

export const bookingKeys = { list: (userId: number) => ['bookings', { userId }] as const }

export function useBookings() {
  const { session } = useSession()
  const userId = session?.user.id ?? 0
  return useQuery({
    queryKey: bookingKeys.list(userId),
    enabled: Boolean(session),
    queryFn: async (): Promise<BookingRow[]> => {
      const hasil = await apiFetch<{ data: BookingRow[] }>('/bookings')
      return hasil.data
    },
  })
}

export function useAjukanSewa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (unitId: number) =>
      apiFetch<{ data: BookingRow }>('/bookings', { method: 'POST', body: { unit_id: unitId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  })
}

export function useUbahStatusPengajuan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: BookingRow['status'] }) =>
      apiFetch<{ data: BookingRow }>(`/bookings/${id}`, { method: 'PATCH', body: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  })
}
