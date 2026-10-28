import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dariStatusBayar, keDaftarPembayaran, kePembayaran } from '@/api/adapters/payments'
import { apiDownload, apiFetch, bukaEntitas } from '@/api/client'
import type { PaymentRow } from '@/api/types'
import { useSession } from '@/features/auth/api'
import { tanggalHariIni } from '@/lib/tanggal'

export const paymentKeys = { list: (userId: number) => ['payments', { userId }] as const }

/* Nama cadangan dipakai saat `Content-Disposition` tidak sampai ke peramban
   (mis. origin lain tanpa header terekspos). */
export function useUnduhLaporanTagihan() {
  return useMutation({
    mutationFn: () => apiDownload('/payments/export', `laporan-tagihan-${tanggalHariIni().replaceAll('-', '')}.csv`),
  })
}

export function usePayments() {
  const { session } = useSession()
  const userId = session?.user.id ?? 0
  return useQuery({
    queryKey: paymentKeys.list(userId),
    enabled: Boolean(session),
    queryFn: async (): Promise<PaymentRow[]> => keDaftarPembayaran(await apiFetch<unknown>('/payments')),
  })
}

/* Unggah bukti bayar membuat baris pembayaran baru: backend tidak punya rute
   ubah-bukti, jadi `POST /payments` dengan `multipart/form-data` adalah satu-
   satunya jalan. `Belum Bayar` di layar berarti belum ada baris sama sekali. */
export function useUnggahBukti() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (masukan: { contract_id: number; month: string; amount: number; proof: File }) => {
      const badan = new FormData()
      badan.set('contract_id', String(masukan.contract_id))
      badan.set('month', masukan.month)
      badan.set('amount', String(masukan.amount))
      badan.set('proof', masukan.proof)
      /* `apiFetch` tidak memaksa `Content-Type` untuk FormData: batas multipart
         harus disusun peramban sendiri. */
      return apiFetch<{ data: unknown }>('/payments', { method: 'POST', body: badan })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })
}

/* Pencatatan manual oleh pemilik: tanpa berkas, jadi JSON — berbeda dari
   unggahan bukti penyewa yang memakai `FormData`. */
export function useCatatPembayaran() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (masukan: { contract_id: number; month: string; amount: number }) =>
      kePembayaran(bukaEntitas(await apiFetch<unknown>('/payments', { method: 'POST', body: masukan }), 'payment')),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })
}

export function useVerifikasiPembayaran() {
  const queryClient = useQueryClient()
  return useMutation({
    /* `Lunas`/`Ditolak` dari halaman diterjemahkan ke `paid`/`rejected`. */
    mutationFn: async ({ id, status }: { id: number; status: PaymentRow['status'] }) =>
      kePembayaran(bukaEntitas(await apiFetch<unknown>(`/payments/${id}`, { method: 'PUT', body: { status: dariStatusBayar(status) } }), 'payment')),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })
}
