import type { Role } from '@/api/types'
import type { Session } from '@/features/auth/session'
import { writeSession } from '@/features/auth/session'

/* Token uji harus membawa `sub` yang sah: handler membaca peran dari token,
   seperti backend asli. Token palsu `mock.abc.tanda` akan jatuh ke pemilik
   bawaan dan menyamarkan peran yang sedang diuji. */
export function masukSebagai(id: number, role: Role, nama: string): Session {
  const sesi: Session = {
    token: `mock.${btoa(JSON.stringify({ sub: id }))}.tanda`,
    user: { id, name: nama, email: `${nama.split(' ')[0].toLowerCase()}@mail.com`, role },
  }
  writeSession(sesi)
  return sesi
}
