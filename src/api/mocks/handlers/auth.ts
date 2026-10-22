import { http, HttpResponse } from 'msw'
import { users } from '@/api/mocks/data/users'
import { subDariToken } from '@/api/mocks/token'
import type { User } from '@/api/types'

/* Pemilik pertama pada data contoh; dipakai hanya bila token tidak membawa sub
   yang bisa dibaca (mis. token uji yang dipalsukan). */
const PEMILIK_BAWAAN = 402

function tokenUntuk(userId: number) {
  return `mock.${btoa(JSON.stringify({ sub: userId }))}.tanda`
}

let urutan = users.length + 401

/* Rute baru (`/login`, `/register`, `/me`) hidup berdampingan dengan rute lama
   berawalan `/auth/` selama transisi, jadi logikanya ditulis sekali di sini. */
async function masuk({ request }: { request: Request }) {
  const { email, password } = (await request.json()) as { email: string; password: string }
  const user = users.find((kandidat) => kandidat.email === email)
  if (!user) {
    return HttpResponse.json({ message: 'Email atau kata sandi tidak cocok.' }, { status: 401 })
  }
  if (!password || password.length < 8) {
    return HttpResponse.json(
      { message: 'Periksa isian.', errors: { password: 'Kata sandi kurang dari 8 karakter. Tambahkan sampai minimal 8 karakter.' } },
      { status: 422 },
    )
  }
  return HttpResponse.json({ token: tokenUntuk(user.id), user })
}

async function daftar({ request }: { request: Request }) {
  const { name, email, password } = (await request.json()) as { name: string; email: string; password: string }
  if (!email || !email.includes('@')) {
    return HttpResponse.json({ message: 'Periksa isian.', errors: { email: 'Email belum sah.' } }, { status: 422 })
  }
  if (!password || password.length < 8) {
    return HttpResponse.json(
      { message: 'Periksa isian.', errors: { password: 'Kata sandi kurang dari 8 karakter. Tambahkan sampai minimal 8 karakter.' } },
      { status: 422 },
    )
  }
  const user: User = {
    id: ++urutan,
    name: name?.trim() || email.split('@')[0],
    email,
    role: 'penyewa',
    phone: '',
    city: '',
    /* Akun baru menunggu admin memeriksa KTP-nya. */
    ktp: 'Menunggu',
    joined: '9 Okt 2026',
  }
  users.push(user)
  return HttpResponse.json({ token: tokenUntuk(user.id), user }, { status: 201 })
}

function penggunaDariToken(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token || !token.startsWith('mock.')) return null
  return users.find((kandidat) => kandidat.id === subDariToken(token)) ?? users.find((kandidat) => kandidat.id === PEMILIK_BAWAAN)
}

/* `/me` mengirim pengguna di dalam amplop `{ data }` seperti endpoint Laravel
   lain, sehingga pembaca frontend memakai satu pembuka (`buka`) yang sama. */
function saya({ request }: { request: Request }) {
  const user = penggunaDariToken(request)
  if (!user) return HttpResponse.json({ message: 'Sesi tidak sah.' }, { status: 401 })
  return HttpResponse.json({ data: user })
}

function sayaLama({ request }: { request: Request }) {
  const user = penggunaDariToken(request)
  if (!user) return HttpResponse.json({ message: 'Sesi tidak sah.' }, { status: 401 })
  return HttpResponse.json({ user })
}

export const authHandlers = [
  http.post('/login', masuk),
  http.post('/register', daftar),
  http.get('/me', saya),

  http.post('/auth/login', masuk),
  http.post('/auth/register', daftar),
  http.get('/auth/me', sayaLama),
]
