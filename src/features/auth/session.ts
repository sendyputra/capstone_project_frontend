import { useSyncExternalStore } from 'react'
import type { Role } from '@/api/types'

export type Session = { token: string; user: { id: number; name: string; email: string; role: Role } }

const KUNCI = 'nb.session'
const pendengar = new Set<() => void>()
let tersimpan: Session | null = null
let terakhirDibaca: string | null = null

function sahkan(nilai: unknown): Session | null {
  if (!nilai || typeof nilai !== 'object') return null
  const kandidat = nilai as Partial<Session>
  const user = kandidat.user as Session['user'] | undefined
  if (typeof kandidat.token !== 'string' || !kandidat.token) return null
  if (!user || typeof user.id !== 'number' || typeof user.role !== 'string' || typeof user.email !== 'string') return null
  return { token: kandidat.token, user: { id: user.id, name: String(user.name ?? ''), email: user.email, role: user.role } }
}

function beritahu() {
  pendengar.forEach((fn) => fn())
}

/* Membaca dari localStorage dengan satu acuan yang stabil selama isinya tidak
   berubah — syarat useSyncExternalStore. Bentuk yang rusak diperlakukan sebagai
   belum masuk, bukan sebagai galat. */
export function readSession(): Session | null {
  const mentah = localStorage.getItem(KUNCI)
  if (mentah === terakhirDibaca) return tersimpan
  terakhirDibaca = mentah
  if (!mentah) {
    tersimpan = null
    return tersimpan
  }
  try {
    tersimpan = sahkan(JSON.parse(mentah))
  } catch {
    tersimpan = null
  }
  if (!tersimpan) localStorage.removeItem(KUNCI)
  return tersimpan
}

export function writeSession(sesi: Session) {
  localStorage.setItem(KUNCI, JSON.stringify(sesi))
  terakhirDibaca = null
  beritahu()
}

export function clearSession() {
  localStorage.removeItem(KUNCI)
  tersimpan = null
  terakhirDibaca = null
  beritahu()
}

export function subscribeSession(fn: () => void) {
  pendengar.add(fn)
  return () => pendengar.delete(fn)
}

/* Penanda bahwa sesi baru saja dibuang karena server menolaknya (401), supaya
   layar masuk bisa menjelaskan kenapa pengguna tiba kembali di sana. */
let kedaluwarsa = false

export function tandaiSesiKedaluwarsa() {
  kedaluwarsa = true
}

export function bacaSesiKedaluwarsa() {
  return kedaluwarsa
}

export function bersihkanSesiKedaluwarsa() {
  kedaluwarsa = false
}

export function useStoredSession(): Session | null {
  return useSyncExternalStore(subscribeSession, readSession, () => null)
}
