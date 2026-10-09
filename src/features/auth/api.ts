import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type { User } from '@/api/types'
import { clearSession, useStoredSession, writeSession, type Session } from '@/features/auth/session'

export function useSession(): { session: Session | null; isLoading: boolean } {
  const tersimpan = useStoredSession()
  /* Panggilan ini hanya memastikan token masih berlaku: 401 ditangani sekali di
     `apiFetch` (sesi dibuang + penanda kedaluwarsa), sehingga tidak ada efek
     samping di dalam render. */
  const query = useQuery({
    queryKey: ['auth', 'me', tersimpan?.user.id ?? 0],
    enabled: Boolean(tersimpan),
    retry: false,
    staleTime: Infinity,
    queryFn: async (): Promise<User> => {
      const { user } = await apiFetch<{ user: User }>('/auth/me')
      return user
    },
  })

  if (!tersimpan) return { session: null, isLoading: false }
  return { session: tersimpan, isLoading: query.isPending }
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (masukan: { email: string; password: string }) =>
      apiFetch<{ token: string; user: User }>('/auth/login', { method: 'POST', body: masukan }),
    onSuccess: (hasil) => {
      writeSession({ token: hasil.token, user: hasil.user })
      queryClient.setQueryData(['auth', 'me', hasil.user.id], hasil.user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return () => {
    clearSession()
    queryClient.clear()
  }
}
