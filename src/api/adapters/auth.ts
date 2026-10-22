import { buka } from '@/api/client'
import { ApiError } from '@/api/types'
import type { KtpStatus, Role, User } from '@/api/types'

const PERAN: Role[] = ['penyewa', 'pemilik']
const STATUS_KTP: KtpStatus[] = ['Terverifikasi', 'Menunggu', 'Belum']

/* Adaptor ini hanya memeriksa bentuk data yang baru datang dari API: peran di
   luar dua nilai (mis. `admin`) dilempar sebagai galat, bukan dipetakan
   diam-diam, supaya DTO tak dikenal tidak menyamar jadi pengguna yang sah.
   Sesi yang sudah tersimpan tidak dijaga di sini — `readSession()` di
   `features/auth/session.ts` yang menolak peran di luar dua nilai saat membaca
   localStorage, dan permintaan yang gagal karena jaringan tidak menghapus sesi. */
function kePeran(nilai: unknown): Role {
  const peran = String(nilai) as Role
  if (!PERAN.includes(peran)) throw new ApiError('server', 0, 'Peran akun tidak dikenali.')
  return peran
}

function keStatusKtp(baris: Record<string, unknown>): KtpStatus {
  const nilai = String(baris.ktp_status ?? baris.ktp ?? '')
  return STATUS_KTP.find((status) => status === nilai) ?? 'Belum'
}

function keTanggal(baris: Record<string, unknown>): string {
  /* Selama transisi, DTO lama menamai tanggal bergabung `joined`, DTO baru
     `created_at`. Keduanya diterima supaya sesi tetap utuh di tengah migrasi. */
  return String(baris.created_at ?? baris.joined ?? '')
}

export function keUser(dto: unknown): User {
  const baris = (dto ?? {}) as Record<string, unknown>
  return {
    id: Number(baris.id),
    name: String(baris.name ?? ''),
    email: String(baris.email ?? ''),
    role: kePeran(baris.role),
    phone: String(baris.phone ?? ''),
    city: String(baris.city ?? ''),
    ktp: keStatusKtp(baris),
    joined: keTanggal(baris),
  }
}

export function keSession(muatan: unknown): { token: string; user: User } {
  const isi = buka<{ token?: unknown; user?: unknown }>(muatan)
  return { token: String(isi?.token ?? ''), user: keUser(isi?.user) }
}
