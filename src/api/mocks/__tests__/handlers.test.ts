import { afterEach, describe, expect, it } from 'vitest'
import { apiFetch } from '@/api/client'
import { aktifkanSimulasi } from '@/api/mocks/handlers/simulasi'
import { writeSession, type Session } from '@/features/auth/session'
import type { BookingRow, ContractRow, PaymentRow, UnitRow, User } from '@/api/types'

function sesi(id: number, role: Session['user']['role'], nama: string): Session {
  return { token: `mock.${btoa(JSON.stringify({ sub: id }))}.tanda`, user: { id, name: nama, email: 'x@mail.com', role } }
}

const admin = sesi(401, 'admin', 'Admin Nusantara')
const pemilik = sesi(402, 'pemilik', 'Pak Wahyu')
const penyewa = sesi(405, 'penyewa', 'Siti Sarah')

afterEach(() => {
  localStorage.clear()
})

describe('data contoh', () => {
  it('menyajikan lima unit dengan tipe, fasilitas, gambar, dan tanggal terisi', async () => {
    writeSession(admin)
    const { data } = await apiFetch<{ data: UnitRow[] }>('/units')
    expect(data).toHaveLength(5)
    expect(data[0]).toMatchObject({ name: 'Kos Kamar 01', type: 'Kamar Kos', status: 'Tersedia' })
    expect(data[0].facilities.length).toBeGreaterThan(0)
    expect(data[0].image).toMatch(/^\/demo\//)
    expect(data[0].booked_dates).toEqual([5, 6, 7, 12, 13, 20])
  })

  it('menyajikan pengajuan, kontrak, tagihan, dan pengguna sejumlah purwarupa', async () => {
    writeSession(admin)
    expect((await apiFetch<{ data: BookingRow[] }>('/bookings')).data).toHaveLength(2)
    expect((await apiFetch<{ data: ContractRow[] }>('/contracts')).data).toHaveLength(4)
    expect((await apiFetch<{ data: PaymentRow[] }>('/payments')).data).toHaveLength(4)
    expect((await apiFetch<{ data: User[] }>('/users')).data).toHaveLength(5)
  })

  it('menyertakan nama pemilik, penyewa, dan unit pada baris hasil join', async () => {
    writeSession(admin)
    const kontrak = (await apiFetch<{ data: ContractRow[] }>('/contracts')).data[0]
    expect(kontrak.renter_name).toBe('Siti Sarah')
    expect(kontrak.unit_title).toBe('Kontrakan Rumah Asri Type 36')
    expect(kontrak.owner_name).toBe('Pak Wahyu')
    const tagihan = (await apiFetch<{ data: PaymentRow[] }>('/payments')).data[0]
    expect(tagihan.unit_title).toBe('Kontrakan Rumah Asri Type 36')
  })

  it('mengirim seluruh unit ke penyewa dan hanya unit sendiri ke pemilik', async () => {
    writeSession(penyewa)
    const katalog = (await apiFetch<{ data: UnitRow[] }>('/units')).data
    expect(katalog).toHaveLength(5)

    writeSession(pemilik)
    const milik = (await apiFetch<{ data: UnitRow[] }>('/units')).data
    expect(milik).toHaveLength(3)
    expect(milik.every((unit) => unit.owner_id === 402)).toBe(true)
  })

  it('menukar status unit lewat PATCH /units/:id/status', async () => {
    writeSession(pemilik)
    await apiFetch('/units/1/status', { method: 'PATCH', body: { status: 'Terisi' } })
    const unit = (await apiFetch<{ data: UnitRow }>('/units/1')).data
    expect(unit.status).toBe('Terisi')
  })

  it('mengubah status pengajuan sewa', async () => {
    writeSession(pemilik)
    await apiFetch('/bookings/101', { method: 'PATCH', body: { status: 'Disetujui' } })
    const pengajuan = (await apiFetch<{ data: BookingRow[] }>('/bookings')).data.find((baris) => baris.id === 101)
    expect(pengajuan?.status).toBe('Disetujui')
  })

  it('mengubah status kontrak', async () => {
    writeSession(admin)
    await apiFetch('/contracts/201', { method: 'PATCH', body: { status: 'Selesai' } })
    const kontrak = (await apiFetch<{ data: ContractRow[] }>('/contracts')).data.find((baris) => baris.id === 201)
    expect(kontrak?.status).toBe('Selesai')
  })

  it('menerima dan menolak bukti bayar', async () => {
    writeSession(admin)
    await apiFetch('/payments/302', { method: 'PATCH', body: { status: 'Lunas' } })
    await apiFetch('/payments/301', { method: 'PATCH', body: { status: 'Ditolak' } })
    const tagihan = (await apiFetch<{ data: PaymentRow[] }>('/payments')).data
    expect(tagihan.find((baris) => baris.id === 302)?.status).toBe('Lunas')
    expect(tagihan.find((baris) => baris.id === 301)?.status).toBe('Ditolak')
  })

  it('unggah bukti bayar gagal sekali lalu berhasil', async () => {
    writeSession(penyewa)
    aktifkanSimulasi()
    await expect(apiFetch('/payments/301/proof', { method: 'POST', body: { proof_url: 'bukti.jpg' } })).rejects.toThrow()
    await apiFetch('/payments/301/proof', { method: 'POST', body: { proof_url: 'bukti.jpg' } })
    const tagihan = (await apiFetch<{ data: PaymentRow[] }>('/payments')).data.find((baris) => baris.id === 301)
    expect(tagihan?.status).toBe('Menunggu Verifikasi')
    expect(tagihan?.proof_url).toBe('bukti.jpg')
  })

  it('mengubah peran pengguna dan menolak menghapus akun sendiri', async () => {
    writeSession(admin)
    await apiFetch('/users/405', { method: 'PATCH', body: { role: 'pemilik' } })
    const pengguna = (await apiFetch<{ data: User[] }>('/users')).data.find((baris) => baris.id === 405)
    expect(pengguna?.role).toBe('pemilik')

    await expect(apiFetch('/users/401', { method: 'DELETE' })).rejects.toMatchObject({ kind: 'conflict' })
  })

  it('mendaftarkan akun baru dan mengembalikan sesinya', async () => {
    const hasil = await apiFetch<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: { name: 'Warga Baru', email: 'baru@mail.com', password: 'rahasia123' },
    })
    expect(hasil.token).toMatch(/^mock\./)
    expect(hasil.user.role).toBe('penyewa')
  })
})
