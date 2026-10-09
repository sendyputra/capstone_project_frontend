import { http, HttpResponse } from 'msw'
import { users } from '@/api/mocks/data/users'

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
    const user = users.find((kandidat) => kandidat.id === 402)
    return HttpResponse.json({ user })
  }),
]
