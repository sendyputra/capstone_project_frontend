import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import { keDaftarNotifikasi } from '@/api/adapters/notifications'
import { useSession } from '@/features/auth/api'

export const notificationKeys = { list: (userId: number) => ['notifications', userId] as const }

/* Pengingat datang dari penjadwal harian, jadi panel menyegarkan diri setiap
   menit tanpa perlu muat ulang halaman. */
export function useNotifications() {
  const { session } = useSession()
  const userId = session?.user.id ?? 0
  return useQuery({
    queryKey: notificationKeys.list(userId),
    enabled: Boolean(session),
    queryFn: async () => keDaftarNotifikasi(await apiFetch('/notifications')),
    refetchInterval: 60_000,
  })
}

export function useTandaiNotifikasi() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useTandaiSemua() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<void>('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
