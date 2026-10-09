import { beforeEach, describe, expect, it } from 'vitest'
import { clearSession, readSession, subscribeSession, writeSession } from '@/features/auth/session'

const sesi = { token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' as const } }

describe('penyimpanan sesi', () => {
  beforeEach(() => localStorage.clear())

  it('mengembalikan null bila belum ada sesi', () => {
    expect(readSession()).toBeNull()
  })

  it('menyimpan dan membaca kembali sesi', () => {
    writeSession(sesi)
    expect(readSession()).toEqual(sesi)
  })

  it('memperlakukan JSON rusak sebagai belum masuk, tanpa melempar galat', () => {
    localStorage.setItem('nb.session', '{bukan json')
    expect(readSession()).toBeNull()
  })

  it('memperlakukan bentuk yang tidak lengkap sebagai belum masuk', () => {
    localStorage.setItem('nb.session', JSON.stringify({ token: 'ada' }))
    expect(readSession()).toBeNull()
  })

  it('mengembalikan acuan yang sama selama isi tidak berubah', () => {
    writeSession(sesi)
    expect(readSession()).toBe(readSession())
  })

  it('membersihkan kunci yang rusak supaya tidak dibaca berulang', () => {
    localStorage.setItem('nb.session', '{bukan json')
    readSession()
    expect(localStorage.getItem('nb.session')).toBeNull()
  })

  it('memberi tahu pelanggan saat sesi dibuang', () => {
    const dipanggil: number[] = []
    const lepas = subscribeSession(() => dipanggil.push(1))
    writeSession(sesi)
    clearSession()
    lepas()
    expect(dipanggil).toHaveLength(2)
  })
})
