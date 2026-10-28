import { ApiError } from '@/api/types'
import { clearSession, readSession, tandaiSesiKedaluwarsa } from '@/features/auth/session'

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

/* Laravel mengirim galat isian sebagai larik pesan per bidang; layar hanya
   menampilkan pesan pertama, jadi ratakan di sini sekali saja. */
async function lemparGalat(respons: Response, sesi: ReturnType<typeof readSession>): Promise<never> {
  const teks = await respons.text()
  let muatan: unknown = {}
  try {
    muatan = teks ? JSON.parse(teks) : {}
  } catch {
    muatan = {}
  }

  const kind = jenisGalat(respons.status)
  /* Permintaan bertoken yang ditolak berarti sesinya tidak berlaku lagi —
     buang sekali di sini supaya penjaga rute mengantar kembali ke /masuk.
     Permintaan tanpa sesi (mis. login gagal) tidak mengubah apa pun. */
  if (kind === 'unauthorized' && sesi) {
    clearSession()
    tandaiSesiKedaluwarsa()
  }

  const mentah = (muatan as { errors?: Record<string, string | string[]> }).errors ?? {}
  const fields = Object.fromEntries(
    Object.entries(mentah).map(([kunci, nilai]) => [kunci, Array.isArray(nilai) ? nilai[0] : nilai]),
  )
  throw new ApiError(kind, respons.status, (muatan as { message?: string }).message ?? pesanUmum[kind], fields)
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const sesi = readSession()
  /* Unggahan berkas memakai FormData: biarkan peramban menyusun sendiri batas
     multipart, jadi header Content-Type tidak boleh dipaksa JSON. Badan
     disimpan di lokal supaya `unknown` bisa menyempit lewat `isFormData`. */
  const badan = options.body
  const isFormData = badan instanceof FormData
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (badan !== undefined && !isFormData) headers['Content-Type'] = 'application/json'
  if (sesi) headers.Authorization = `Bearer ${sesi.token}`

  let respons: Response
  try {
    respons = await fetch(BASE_URL + path, {
      method: options.method ?? 'GET',
      headers,
      body: badan === undefined ? undefined : isFormData ? badan : JSON.stringify(badan),
      signal: options.signal,
    })
  } catch (galat) {
    if (galat instanceof DOMException && galat.name === 'AbortError') throw galat
    throw new ApiError('network', 0, pesanUmum.network)
  }

  if (!respons.ok) await lemparGalat(respons, sesi)

  if (respons.status === 204) return undefined as T

  const teks = await respons.text()
  return (teks ? JSON.parse(teks) : {}) as T
}

export async function apiDownload(path: string, namaCadangan: string): Promise<void> {
  const sesi = readSession()
  const headers: Record<string, string> = {}
  if (sesi) headers.Authorization = `Bearer ${sesi.token}`

  let respons: Response
  try {
    respons = await fetch(BASE_URL + path, { headers })
  } catch {
    throw new ApiError('network', 0, pesanUmum.network)
  }

  if (!respons.ok) await lemparGalat(respons, sesi)

  const disposisi = respons.headers.get('Content-Disposition') ?? ''
  const nama =
    disposisi.match(/filename="([^"]+)"/)?.[1] ??
    disposisi.match(/filename=([^;]+)/)?.[1]?.trim() ??
    namaCadangan

  const url = URL.createObjectURL(await respons.blob())
  const tautan = document.createElement('a')
  tautan.href = url
  tautan.download = nama
  tautan.rel = 'noopener'
  document.body.append(tautan)
  tautan.click()
  tautan.remove()
  URL.revokeObjectURL(url)
}

/* Sebagian besar endpoint Laravel membungkus muatan sebagai { data: ... };
   sebagian lain mengirim larik atau objek langsung. Satu pembuka untuk ketiganya
   supaya pemanggil tidak perlu tahu bentuk mana yang datang. */
export function buka<T>(muatan: unknown): T {
  if (muatan && typeof muatan === 'object' && 'data' in muatan) return (muatan as { data: T }).data
  return muatan as T
}

/* Mutasi Laravel membalas `{message, unit: ...}` — bukan `{data: ...}`.
   Pembuka ini mengambil bidang bernama itu, lalu jatuh ke `buka` supaya
   respons berbentuk `{data: ...}` atau objek langsung tetap terbaca. */
export function bukaEntitas<T>(muatan: unknown, kunci: string): T {
  const isi = buka<Record<string, unknown>>(muatan)
  if (isi && typeof isi === 'object' && kunci in isi) return isi[kunci] as T
  return isi as T
}
