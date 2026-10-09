import { ApiError } from '@/api/types'
import { readSession } from '@/features/auth/session'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const pesanUmum: Record<string, string> = {
  server: 'Terjadi gangguan di server. Coba lagi sebentar lagi.',
  network: 'Koneksi terputus. Periksa jaringan, lalu coba lagi.',
  not_found: 'Data yang diminta tidak ditemukan.',
  conflict: 'Perubahan bentrok dengan data terbaru. Muat ulang halaman.',
  unauthorized: 'Sesi Anda berakhir. Silakan masuk kembali.',
  validation: 'Ada isian yang perlu diperbaiki.',
}

function jenisGalat(status: number): ApiError['kind'] {
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'unauthorized'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 422) return 'validation'
  if (status >= 500) return 'server'
  return 'server'
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const sesi = readSession()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (sesi) headers.Authorization = `Bearer ${sesi.token}`

  let respons: Response
  try {
    respons = await fetch(BASE_URL + path, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (galat) {
    if (galat instanceof DOMException && galat.name === 'AbortError') throw galat
    throw new ApiError('network', 0, pesanUmum.network)
  }

  if (respons.status === 204) return undefined as T

  const teks = await respons.text()
  const muatan = teks ? JSON.parse(teks) : {}

  if (!respons.ok) {
    const kind = jenisGalat(respons.status)
    const fields = kind === 'validation' ? (muatan.errors as Record<string, string>) : undefined
    throw new ApiError(kind, respons.status, muatan.message ?? pesanUmum[kind], fields)
  }

  return muatan as T
}
