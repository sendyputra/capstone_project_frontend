import { http, HttpResponse } from 'msw'
import { users } from '@/api/mocks/data/users'
import { tenants } from '@/api/mocks/data/tenants'
import { subDariToken } from '@/api/mocks/token'
import type { Tenant, User } from '@/api/types'

/* Pemilik pertama pada data contoh; dipakai hanya bila token tidak membawa sub
   yang bisa dibaca (mis. token uji yang dipalsukan). */
const PEMILIK_BAWAAN = 402

function tokenUntuk(userId: number) {
  return `mock.${btoa(JSON.stringify({ sub: userId }))}.tanda`
}

let urutan = users.length + 401

/* Akun baru langsung menjadi penyewa: tanpa baris `tenants` yang menunjuk
   `user_id`-nya, kontrak yang ia ajukan jatuh ke `tenant_id: 0` dan layar
   pemilik menampilkan "Tanpa penyewa" / "Belum". Nomornya dihitung dari data
   yang sedang hidup, bukan dari penghitung modul: `resetData` mengembalikan
   daftar penyewa ke snapshot, jadi id yang dipakai pun ikut kembali — snapshot
   tetap sumber kebenaran. */
function idTenantBaru(): number {
  return Math.max(...tenants.map((tenant) => tenant.id)) + 1
}

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

/* Pendaftaran menerima `multipart/form-data` karena berkas KTP ikut terkirim.
   Bagian berkas diperiksa dari bentuknya (`typeof ... === 'string'`), bukan lewat
   `instanceof File`: kelas `File` di jsdom berbeda realm dari kelas yang dipakai
   parser multipart, sehingga `instanceof` menolak unggahan yang sah. */
async function daftar({ request }: { request: Request }) {
  const badan = await request.formData()
  const teks = (nama: string) => {
    const nilai = badan.get(nama)
    return typeof nilai === 'string' ? nilai : ''
  }
  const name = teks('name')
  const email = teks('email')
  const password = teks('password')
  const role = teks('role') === 'pemilik' ? 'pemilik' : 'penyewa'
  const berkasKtp = badan.get('ktp')
  if (!email || !email.includes('@')) {
    return HttpResponse.json({ message: 'Periksa isian.', errors: { email: 'Email belum sah.' } }, { status: 422 })
  }
  if (!password || password.length < 8) {
    return HttpResponse.json(
      { message: 'Periksa isian.', errors: { password: 'Kata sandi kurang dari 8 karakter. Tambahkan sampai minimal 8 karakter.' } },
      { status: 422 },
    )
  }
  if (!berkasKtp || typeof berkasKtp === 'string') {
    return HttpResponse.json(
      { message: 'Periksa isian.', errors: { ktp: 'Berkas KTP wajib diunggah.' } },
      { status: 422 },
    )
  }
  /* Satu tanggal bergabung untuk akun dan baris penyewanya, supaya keduanya
     tidak pernah berselisih; gaya labelnya mengikuti data contoh. */
  const bergabung = '9 Okt 2026'
  const user: User = {
    id: ++urutan,
    name: name.trim() || email.split('@')[0],
    email,
    role,
    phone: '',
    city: '',
    /* Akun baru menunggu KTP-nya diperiksa. */
    ktp: 'Menunggu',
    joined: bergabung,
  }
  users.push(user)
  /* Baris penyewa dibuat bersama akunnya: kontrak yang diajukan akun baru
     dibaca lewat `tenantByUserId`, jadi tanpanya pemilik melihat "Tanpa
     penyewa" dan kolom KTP "Belum" untuk penyewa yang sah. Teleponnya kosong
     karena formulir pendaftaran belum menanyakannya, dan status KTP-nya
     mengikuti akun (`Menunggu`). */
  const tenant: Tenant = {
    id: idTenantBaru(),
    user_id: user.id,
    name: user.name,
    phone: '',
    ktp: 'Menunggu',
    joined: bergabung,
  }
  tenants.push(tenant)
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
