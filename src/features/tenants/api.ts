import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, bukaEntitas } from '@/api/client'
import { dariKtp, keDaftarTenant, keTenant } from '@/api/adapters/tenants'
import type { KtpStatus, TenantRow } from '@/api/types'
import { useSession } from '@/features/auth/api'

export type MasukanTenant = { name: string; phone?: string; ktp?: KtpStatus }

export const tenantKeys = { list: (userId: number) => ['tenants', { userId }] as const }

/* Cakupan baris dibaca dari token: penyewa buatan pemilik plus penyewa yang
   punya kontrak pada unitnya. */
export function useTenants() {
  const { session } = useSession()
  const userId = session?.user.id ?? 0
  return useQuery({
    queryKey: tenantKeys.list(userId),
    enabled: Boolean(session),
    queryFn: async (): Promise<TenantRow[]> => keDaftarTenant(await apiFetch('/tenants')),
  })
}

/* Nama penyewa juga tampil di baris kontrak, jadi daftar kontrak ikut
   disegarkan setiap kali penyewa berubah. */
function segarkan(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['tenants'] })
  queryClient.invalidateQueries({ queryKey: ['contracts'] })
}

function muatanTenant(masukan: MasukanTenant): Record<string, unknown> {
  return {
    name: masukan.name,
    ...(masukan.phone === undefined ? {} : { phone: masukan.phone }),
    ...(masukan.ktp === undefined ? {} : { ktp_status: dariKtp(masukan.ktp) }),
  }
}

export function useBuatTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (masukan: MasukanTenant) =>
      keTenant(bukaEntitas(await apiFetch('/tenants', { method: 'POST', body: muatanTenant(masukan) }), 'tenant')),
    onSuccess: () => segarkan(queryClient),
  })
}

export function useUbahTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...masukan }: { id: number } & MasukanTenant) =>
      keTenant(bukaEntitas(await apiFetch(`/tenants/${id}`, { method: 'PUT', body: muatanTenant(masukan) }), 'tenant')),
    onSuccess: () => segarkan(queryClient),
  })
}

export function useHapusTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/tenants/${id}`, { method: 'DELETE' }),
    onSuccess: () => segarkan(queryClient),
  })
}
