import { units } from '@/api/mocks/data/units'
import { users } from '@/api/mocks/data/users'
import { tenants } from '@/api/mocks/data/tenants'
import { bookings } from '@/api/mocks/data/bookings'
import { contracts } from '@/api/mocks/data/contracts'
import { payments } from '@/api/mocks/data/payments'

/* Data contoh hidup sebagai array di tingkat modul, jadi perubahan satu tes
   (menghapus unit, menukar status pengajuan) terbawa ke tes berikutnya dalam
   berkas yang sama. Snapshot ini mengembalikannya sebelum tiap tes. */
const awal = {
  units: units.map((baris) => ({ ...baris })),
  users: users.map((baris) => ({ ...baris })),
  tenants: tenants.map((baris) => ({ ...baris })),
  bookings: bookings.map((baris) => ({ ...baris })),
  contracts: contracts.map((baris) => ({ ...baris })),
  payments: payments.map((baris) => ({ ...baris })),
}

export function resetData() {
  for (const [nama, simpanan] of Object.entries(awal)) {
    const daftar = { units, users, tenants, bookings, contracts, payments }[nama] as unknown[]
    daftar.splice(0, daftar.length, ...simpanan.map((baris) => ({ ...baris })))
  }
}
