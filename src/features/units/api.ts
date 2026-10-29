import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, apiSemuaHalaman, buka, bukaEntitas } from '@/api/client'
import { keBlok, keDaftarBlok } from '@/api/adapters/blocks'
import { dariStatusUnit, keDaftarUnit, keUnit } from '@/api/adapters/units'
import type { UnitBlockRow, UnitInput, UnitRow } from '@/api/types'
import { useSession } from '@/features/auth/api'

/* Formulir unit mengirim multipart karena berkas foto ikut terkirim; semua
   mutasi unit lewat jalur FormData yang sama supaya PUT pun benar. Fasilitas
   satu bagian per butir di bawah nama `facilities[]`, seperti backend Laravel. */
function muatanUnit(nilai: Partial<UnitInput>): FormData {
  const muatan = new FormData()
  if (nilai.name !== undefined) muatan.append('name', nilai.name)
  if (nilai.address !== undefined) muatan.append('address', nilai.address)
  if (nilai.price !== undefined) muatan.append('price', String(nilai.price))
  if (nilai.status !== undefined) muatan.append('status', dariStatusUnit(nilai.status))
  if (nilai.type !== undefined) muatan.append('type', nilai.type)
  for (const fasilitas of nilai.facilities ?? []) muatan.append('facilities[]', fasilitas)
  if (nilai.image !== undefined) muatan.append('image', nilai.image)
  return muatan
}

export const unitKeys = {
  list: (userId: number) => ['units', { userId }] as const,
  publik: ['units', 'publik'] as const,
  detail: (id: number) => ['unit', id] as const,
}

export const blockKeys = { list: (unitId: number) => ['unit-blocks', unitId] as const }

/* Katalog terbuka untuk pengunjung: rutenya tidak memeriksa token, dan cakupan
   barisnya tidak bergantung pada sesi. `limit=50` karena server memaginasi 10
   baris dan katalog tidak punya kontrol halaman. */
export function usePublicUnits() {
  return useQuery({
    queryKey: unitKeys.publik,
    queryFn: async () => keDaftarUnit(await apiFetch('/list/units?limit=50')),
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
    /* `apiSemuaHalaman`: server memaginasi 10 baris, dan pemilik boleh punya lebih. */
    queryFn: async () => keDaftarUnit(await apiSemuaHalaman<unknown>('/units?status=all')),
  })
}

/* Detail unit dibaca dari jalur publik: `/katalog/:id` terbuka untuk pengunjung,
   dan `GET /units/:id` menolak permintaan tanpa token. Pemilik membuka detail
   unitnya lewat halaman yang sama, jadi satu jalur publik melayani keduanya. */
export function useUnit(id: number) {
  return useQuery({
    queryKey: unitKeys.detail(id),
    queryFn: async () => keUnit(buka(await apiFetch(`/detail/unit/${id}`))),
  })
}

export function useCreateUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (nilai: UnitInput) => keUnit(bukaEntitas(await apiFetch('/units', { method: 'POST', body: muatanUnit(nilai) }), 'unit')),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['units'] }),
  })
}

export function useUpdateUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...nilai }: { id: number } & Partial<UnitInput>) =>
      keUnit(bukaEntitas(await apiFetch(`/units/${id}`, { method: 'PUT', body: muatanUnit(nilai) }), 'unit')),
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
      keUnit(bukaEntitas(await apiFetch(`/units/${id}/status`, { method: 'PATCH', body: { status: dariStatusUnit(status) } }), 'unit')),
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

/* Blok mengubah `booked_dates` unit, jadi daftar blok dan detail unit
   disegarkan bersama; kalender membaca keduanya dari detail. */
export function useUnitBlocks(unitId: number) {
  return useQuery({
    queryKey: blockKeys.list(unitId),
    enabled: unitId > 0,
    queryFn: async (): Promise<UnitBlockRow[]> => keDaftarBlok(await apiFetch(`/units/${unitId}/blocks`)),
  })
}

export function useTambahBlok(unitId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (masukan: { start_date: string; end_date: string; note?: string }) =>
      keBlok(bukaEntitas(await apiFetch(`/units/${unitId}/blocks`, { method: 'POST', body: masukan }), 'block')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.list(unitId) })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(unitId) })
    },
  })
}

export function useHapusBlok(unitId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/units/${unitId}/blocks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.list(unitId) })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(unitId) })
    },
  })
}
