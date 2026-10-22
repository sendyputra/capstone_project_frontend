import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, buka } from '@/api/client'
import { dariStatusUnit, keDaftarUnit, keUnit } from '@/api/adapters/units'
import type { UnitInput, UnitRow } from '@/api/types'
import { useSession } from '@/features/auth/api'

/* Formulir memakai label tampilan; API memakai enum backend. Penerjemahan arah
   keluar dikumpulkan di sini supaya tidak ada mutasi yang mengirim label. */
function muatanUnit(nilai: Partial<UnitInput>): Record<string, unknown> {
  const { status, ...sisa } = nilai
  return status === undefined ? sisa : { ...sisa, status: dariStatusUnit(status) }
}

export const unitKeys = {
  list: (userId: number) => ['units', { userId }] as const,
  publik: ['units', 'publik'] as const,
  detail: (id: number) => ['unit', id] as const,
}

/* Katalog terbuka untuk pengunjung: rutenya tidak memeriksa token, dan cakupan
   barisnya tidak bergantung pada sesi. */
export function usePublicUnits() {
  return useQuery({
    queryKey: unitKeys.publik,
    queryFn: async () => keDaftarUnit(await apiFetch('/public/units')),
  })
}

/* Panel pemilik: server membatasi baris dari token, jadi kueri baru berjalan
   setelah sesi ada. */
export function useMyUnits() {
  const { session } = useSession()
  const userId = session?.user.id ?? 0
  return useQuery({
    queryKey: unitKeys.list(userId),
    enabled: Boolean(session),
    queryFn: async () => keDaftarUnit(await apiFetch('/units')),
  })
}

/* Detail unit dibaca dari jalur publik: `/katalog/:id` terbuka untuk pengunjung,
   dan `GET /units/:id` menolak permintaan tanpa token. Pemilik membuka detail
   unitnya lewat halaman yang sama, jadi satu jalur publik melayani keduanya. */
export function useUnit(id: number) {
  return useQuery({
    queryKey: unitKeys.detail(id),
    queryFn: async () => keUnit(buka(await apiFetch(`/public/units/${id}`))),
  })
}

export function useCreateUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (nilai: UnitInput) => keUnit(buka(await apiFetch('/units', { method: 'POST', body: muatanUnit(nilai) }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['units'] }),
  })
}

export function useUpdateUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...nilai }: { id: number } & Partial<UnitInput>) =>
      keUnit(buka(await apiFetch(`/units/${id}`, { method: 'PUT', body: muatanUnit(nilai) }))),
    onSuccess: (_hasil, variabel) => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variabel.id) })
    },
  })
}

export function useUbahStatusUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: UnitRow['status'] }) =>
      keUnit(buka(await apiFetch(`/units/${id}/status`, { method: 'PATCH', body: { status: dariStatusUnit(status) } }))),
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
