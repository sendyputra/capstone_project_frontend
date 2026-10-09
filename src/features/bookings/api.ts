import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type { BookingRow } from '@/api/types'

export function useAjukanSewa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (unitId: number) =>
      apiFetch<{ data: BookingRow }>('/bookings', { method: 'POST', body: { unit_id: unitId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  })
}
