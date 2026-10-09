import { http, HttpResponse } from 'msw'
import { users } from '@/api/mocks/data/users'
import { subDariToken } from '@/api/mocks/token'
import type { Role } from '@/api/types'

export const userHandlers = [
  http.get('/users', () => HttpResponse.json({ data: users })),

  http.patch('/users/:id', async ({ params, request }) => {
    const pengguna = users.find((kandidat) => kandidat.id === Number(params.id))
    if (!pengguna) return HttpResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 })
    const { role } = (await request.json()) as { role: Role }
    pengguna.role = role
    return HttpResponse.json({ data: pengguna })
  }),

  http.delete('/users/:id', ({ params, request }) => {
    const id = Number(params.id)
    /* Akun sendiri tidak boleh dihapus. 409, bukan 403 — klien memetakan 403
       ke "sesi berakhir" dan itu akan membuang sesi admin yang sah. */
    if (subDariToken(request.headers.get('Authorization')) === id) {
      return HttpResponse.json({ message: 'Akun Anda sendiri tidak dapat dihapus.' }, { status: 409 })
    }
    const indeks = users.findIndex((kandidat) => kandidat.id === id)
    if (indeks === -1) return HttpResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 })
    users.splice(indeks, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
