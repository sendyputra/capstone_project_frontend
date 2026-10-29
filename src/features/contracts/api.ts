import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dariStatusKontrak, keDaftarKontrak, keKontrak } from '@/api/adapters/contracts'
import { apiDownload, apiFetch, bukaEntitas } from '@/api/client'
import type { ContractRow } from '@/api/types'
import { useSession } from '@/features/auth/api'
import { tanggalHariIni } from '@/lib/tanggal'

/* Kunci kueri memuat id pengguna, seperti `paymentKeys` dan `unitKeys`: cache
   satu sesi tidak boleh dibaca sesi lain. Invalidasi memakai kunci yang sama,
   jadi mutasi hanya menyegarkan daftar milik pengguna yang sedang masuk. */
export const contractKeys = {
  list: (userId: number) => ['contracts', { userId }] as const,
}

/* Server membatasi baris dari token, jadi kueri baru berjalan setelah sesi ada. */
export function useContracts() {
  const { session } = useSession()
  const userId = session?.user.id ?? 0
  return useQuery({
    queryKey: contractKeys.list(userId),
    enabled: Boolean(session),
    queryFn: async (): Promise<ContractRow[]> => keDaftarKontrak(await apiFetch<unknown>('/contracts?status=all')),
  })
}

/* Semua status kontrak ikut terunduh — laporan pemilik bukan sekadar daftar
   aktif, berbeda dari laporan tagihan. */
export function useUnduhLaporanKontrak() {
  return useMutation({
    mutationFn: () => apiDownload('/contracts/export', `laporan-kontrak-${tanggalHariIni().replaceAll('-', '')}.csv`),
  })
}

/* Pemilik wajib menyertakan `tenant_id` penyewa yang ia kelola; penyewa yang
   mengajukan sendiri tidak mengirimnya dan servernya memakai profil dari token. */
export type MasukanKontrak = {
  unit_id: number
  start_date: string
  end_date: string
  total_price: number
  tenant_id?: number
}

export function useBuatKontrak() {
  const queryClient = useQueryClient()
  const { session } = useSession()
  const userId = session?.user.id ?? 0
  return useMutation({
    mutationFn: async (masukan: MasukanKontrak) =>
      /* Jawaban server dilewatkan adaptor seperti daftar: pemanggil menerima
         baris siap tampil, bukan DTO mentah yang bentuknya lain. */
      keKontrak(bukaEntitas(await apiFetch<unknown>('/contracts', { method: 'POST', body: masukan }), 'contract')),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractKeys.list(userId) }),
  })
}

export function useUbahStatusKontrak() {
  const queryClient = useQueryClient()
  const { session } = useSession()
  const userId = session?.user.id ?? 0
  return useMutation({
    /* Halaman mengirim status tampilan (`Aktif`); API menuntut enum backend
       (`active`). `Menunggu` diterjemahkan ke `pending` walau klien tidak
       pernah mengirimnya sendiri. */
    mutationFn: async ({ id, status }: { id: number; status: ContractRow['status'] }) =>
      keKontrak(bukaEntitas(await apiFetch<unknown>(`/contracts/${id}`, { method: 'PUT', body: { status: dariStatusKontrak(status) } }), 'contract')),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractKeys.list(userId) }),
  })
}
