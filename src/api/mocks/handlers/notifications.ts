import { http, HttpResponse } from 'msw'
import { notifications } from '@/api/mocks/data/notifications'
import { pemanggil } from '@/api/mocks/join'

export const notificationHandlers = [
  /* Cakupan dari token: notifikasi hanya milik pengguna yang sedang masuk.
     Pengunjung ditolak sebelum daftar disentuh. */
  http.get('/notifications', ({ request }) => {
    const { sub, peran } = pemanggil(request)
    if (!peran || sub === null) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const milik = notifications
      .filter((baris) => baris.user_id === sub)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 50)
      .map(({ user_id: _userId, ...baris }) => baris)

    return HttpResponse.json({ data: milik, unread: milik.filter((baris) => baris.read_at === null).length })
  }),

  http.post('/notifications/:id/read', ({ request, params }) => {
    const { sub, peran } = pemanggil(request)
    if (!peran || sub === null) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const notifikasi = notifications.find((baris) => baris.id === params.id && baris.user_id === sub)
    if (!notifikasi) return HttpResponse.json({ message: 'Notifikasi tidak ditemukan.' }, { status: 404 })

    notifikasi.read_at = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/notifications/read-all', ({ request }) => {
    const { sub, peran } = pemanggil(request)
    if (!peran || sub === null) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const waktu = new Date().toISOString()
    for (const baris of notifications) {
      if (baris.user_id === sub && baris.read_at === null) baris.read_at = waktu
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
