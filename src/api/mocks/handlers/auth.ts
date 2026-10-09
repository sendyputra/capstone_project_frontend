import { http, HttpResponse } from 'msw'
import { users } from '@/api/mocks/data/users'
import { subDariToken } from '@/api/mocks/token'

/* Pemilik pertama pada data contoh; dipakai hanya bila token tidak membawa sub
   yang bisa dibaca (mis. token uji yang dipalsukan). */
const PEMILIK_BAWAAN = 402

function tokenUntuk(userId: number) {
  return `mock.${btoa(JSON.stringify({ sub: userId }))}.tanda`
}

export const authHandlers = [
  http.post('/auth/login', async ({ request }) => {
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
  }),

  http.get('/auth/me', ({ request }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token || !token.startsWith('mock.')) {
      return HttpResponse.json({ message: 'Sesi tidak sah.' }, { status: 401 })
    }
    const user = users.find((kandidat) => kandidat.id === subDariToken(token)) ?? users.find((kandidat) => kandidat.id === PEMILIK_BAWAAN)
    return HttpResponse.json({ user })
  }),
]
