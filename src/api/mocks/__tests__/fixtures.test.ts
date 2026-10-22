import { describe, expect, it } from 'vitest'
import { contracts } from '@/api/mocks/data/contracts'
import { payments } from '@/api/mocks/data/payments'
import { tenants } from '@/api/mocks/data/tenants'
import { units } from '@/api/mocks/data/units'
import { users } from '@/api/mocks/data/users'

const STATUS_UNIT = ['available', 'rented', 'maintenance']
const STATUS_KONTRAK = ['pending', 'active', 'completed', 'cancelled']
const STATUS_BAYAR = ['pending', 'paid', 'rejected']

function unik(daftar: number[]) {
  return new Set(daftar).size === daftar.length
}

describe('integritas data contoh', () => {
  it('menjaga jumlah per peran', () => {
    expect(users.filter((baris) => baris.role === 'pemilik')).toHaveLength(5)
    expect(users.filter((baris) => baris.role === 'penyewa')).toHaveLength(10)
    expect(tenants).toHaveLength(13)
    expect(units).toHaveLength(24)
    expect(contracts).toHaveLength(24)
    expect(payments).toHaveLength(59)
  })

  it('memakai id unik di setiap tabel', () => {
    expect(unik(users.map((baris) => baris.id))).toBe(true)
    expect(unik(tenants.map((baris) => baris.id))).toBe(true)
    expect(unik(units.map((baris) => baris.id))).toBe(true)
    expect(unik(contracts.map((baris) => baris.id))).toBe(true)
    expect(unik(payments.map((baris) => baris.id))).toBe(true)
  })

  it('menghubungkan setiap baris ke induknya', () => {
    const pengguna = new Map(users.map((baris) => [baris.id, baris]))
    const penyewa = new Map(tenants.map((baris) => [baris.id, baris]))
    const unit = new Map(units.map((baris) => [baris.id, baris]))
    const kontrak = new Map(contracts.map((baris) => [baris.id, baris]))

    for (const baris of tenants) {
      if (baris.user_id !== null) {
        expect(pengguna.get(baris.user_id)?.role, `tenant ${baris.id}`).toBe('penyewa')
      }
    }

    for (const baris of units) {
      expect(pengguna.get(baris.owner_id)?.role, `unit ${baris.id}`).toBe('pemilik')
      expect(STATUS_UNIT, `unit ${baris.id}`).toContain(baris.status)
    }

    for (const baris of contracts) {
      expect(unit.has(baris.unit_id), `kontrak ${baris.id}`).toBe(true)
      expect(penyewa.has(baris.tenant_id), `kontrak ${baris.id}`).toBe(true)
      expect(STATUS_KONTRAK, `kontrak ${baris.id}`).toContain(baris.status)
    }

    for (const baris of payments) {
      expect(kontrak.has(baris.contract_id), `pembayaran ${baris.id}`).toBe(true)
      expect(baris.month, `pembayaran ${baris.id}`).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/)
      expect(STATUS_BAYAR, `pembayaran ${baris.id}`).toContain(baris.status)
    }
  })

  it('menyebar unit dan kontrak ke setiap pemilik', () => {
    for (const pemilik of users.filter((baris) => baris.role === 'pemilik')) {
      expect(units.some((baris) => baris.owner_id === pemilik.id), `unit ${pemilik.name}`).toBe(true)
    }
  })
})
