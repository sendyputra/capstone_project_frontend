import { describe, expect, it } from 'vitest'
import { jabatanPeran, labelPeran, toDataRole } from '@/features/auth/roles'
import { readSession, writeSession } from '@/features/auth/session'

describe('pemetaan peran', () => {
  it('memetakan penyewa ke renter', () => {
    expect(toDataRole('penyewa')).toBe('renter')
    expect(labelPeran('penyewa')).toBe('Penyewa')
  })

  it('memetakan pemilik ke owner', () => {
    expect(toDataRole('pemilik')).toBe('owner')
    expect(labelPeran('pemilik')).toBe('Pemilik')
    expect(jabatanPeran('pemilik')).toBe('Pemilik Kos & Kontrakan')
  })
})

describe('sesi lama', () => {
  it('menolak sesi tersimpan yang masih berperan admin', () => {
    localStorage.setItem(
      'nb.session',
      JSON.stringify({ token: 'x', user: { id: 1, name: 'Admin', email: 'a@mail.com', role: 'admin' } }),
    )
    expect(readSession()).toBeNull()
  })

  it('menerima sesi dua peran', () => {
    writeSession({ token: 'x', user: { id: 2, name: 'Sendy', email: 's@mail.com', role: 'pemilik' } })
    expect(readSession()?.user.role).toBe('pemilik')
  })
})
