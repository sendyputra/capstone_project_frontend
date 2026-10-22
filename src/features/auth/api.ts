import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, buka } from '@/api/client'
import { keSession, keUser } from '@/api/adapters/auth'
import type { User } from '@/api/types'
import { clearSession, useStoredSession, writeSession, type Session } from '@/features/auth/session'

export function useSession(): { session: Session | null; isLoading: boolean } {
  const tersimpan = useStoredSession()
  /* Panggilan ini hanya memastikan token masih berlaku: 401 ditangani sekali di
     `apiFetch` (sesi dibuang + penanda kedaluwarsa), sehingga tidak ada efek
     samping di dalam render. Adaptor yang menormalkan DTO pengguna. */
  const query = useQuery({
    queryKey: ['auth', 'me', tersimpan?.user.id ?? 0],
    enabled: Boolean(tersimpan),
    retry: false,
    staleTime: Infinity,
    /* `buka` hanya membuka amplop `{ data: ... }`; sebagian backend (dan mock
       `/auth/me` yang masih dipertahankan) membungkus pengguna sebagai
       `{ user }`. Keduanya diterima di sini, begitu pula objek pengguna polos. */
    queryFn: async (): Promise<User> => {
      const isi = buka<{ user?: unknown }>(await apiFetch('/me'))
      return keUser(isi?.user ?? isi)
    },
  })

  if (!tersimpan) return { session: null, isLoading: false }
  return { session: tersimpan, isLoading: query.isPending }
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (masukan: { email: string; password: string }) =>
      keSession(await apiFetch('/login', { method: 'POST', body: masukan })),
    onSuccess: (hasil) => {
      writeSession({ token: hasil.token, user: hasil.user })
      queryClient.setQueryData(['auth', 'me', hasil.user.id], hasil.user)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (masukan: { email: string; password: string }) =>
      keSession(await apiFetch('/register', { method: 'POST', body: masukan })),
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
