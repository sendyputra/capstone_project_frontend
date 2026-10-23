import { describe, expect, it } from 'vitest'
import { keSession, keUser } from '@/api/adapters/auth'

const dto = { id: 1, name: 'A', email: 'a@mail.com', role: 'pemilik' }

describe('adaptor auth', () => {
  it('membaca token dan user dari amplop', () => {
    const hasil = keSession({ data: { token: 'jwt', user: { ...dto, role: 'pemilik' } } })
    expect(hasil.token).toBe('jwt')
    expect(hasil.user.role).toBe('pemilik')
  })

  it('menolak peran di luar dua nilai', () => {
    expect(() => keUser({ ...dto, role: 'admin' })).toThrow()
  })

  it('menerima kedua penulisan status KTP dan tanggal bergabung', () => {
    expect(keUser({ ...dto, ktp_status: 'Terverifikasi', created_at: '24 Sep 2026' })).toMatchObject({
      ktp: 'Terverifikasi',
      joined: '24 Sep 2026',
    })
    expect(keUser({ ...dto, ktp: 'Menunggu', joined: '1 Okt 2026' })).toMatchObject({
      ktp: 'Menunggu',
      joined: '1 Okt 2026',
    })
  })

  it('memberi nilai aman saat status KTP tak dikenal atau bidang hilang', () => {
    expect(keUser({ ...dto, ktp_status: 'verified' }).ktp).toBe('Belum')
    expect(keUser(dto)).toMatchObject({ ktp: 'Belum', joined: '', phone: '', city: '', id: 1 })
  })

  it('membaca sesi yang dikirim tanpa amplop', () => {
    const hasil = keSession({ token: 'jwt', user: dto })
    expect(hasil.token).toBe('jwt')
    expect(hasil.user.email).toBe('a@mail.com')
  })

  it('meneruskan galat saat peran sesi tidak dikenali', () => {
    expect(() => keSession({ data: { token: 'jwt', user: { ...dto, role: 'admin' } } })).toThrow()
  })

  /* Backend Laravel mengirim `access_token` dan enum peran Inggris. */
  it('membaca access_token dan memetakan owner menjadi pemilik', () => {
    const hasil = keSession({ access_token: 'jwt-baru', token_type: 'bearer', user: { ...dto, role: 'owner' } })
    expect(hasil).toMatchObject({ token: 'jwt-baru', user: { role: 'pemilik' } })
  })

  it('memetakan tenant menjadi penyewa', () => {
    expect(keUser({ ...dto, role: 'tenant' }).role).toBe('penyewa')
  })

  it('memetakan peran domain yang sudah benar tanpa mengubahnya', () => {
    expect(keUser({ ...dto, role: 'penyewa' }).role).toBe('penyewa')
  })
})
