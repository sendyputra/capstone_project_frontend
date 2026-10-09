import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBuilding, faFileSignature, faMoneyCheckDollar, faUsersGear } from '@fortawesome/free-solid-svg-icons'
import { Outlet } from 'react-router'
import { useUsers } from '@/features/admin/api'
import { usePayments } from '@/features/billing/api'
import { useContracts } from '@/features/contracts/api'
import { useUnits } from '@/features/units/api'
import { KpiCard } from '@/ui/kpi-card'

/* Rangka panel admin: satu kepala lintas pemilik plus empat angka ringkas,
   seperti halaman admin purwarupa. */
export function AdminShell() {
  const units = useUnits()
  const kontrak = useContracts()
  const tagihan = usePayments()
  const pengguna = useUsers()

  const kontrakAktif = (kontrak.data ?? []).filter((baris) => baris.status === 'Aktif').length
  const menungguVerifikasi = (tagihan.data ?? []).filter((baris) => baris.status === 'Menunggu Verifikasi').length

  return (
    <section className="mx-auto max-w-container space-y-8 px-4 py-8">
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-panel p-6 text-brand-text-inverse shadow-xl md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-brand-neutral-700 bg-brand-neutral-800 px-3 py-1 text-micro font-bold uppercase tracking-label text-brand-neutral-200">
              Panel Admin
            </span>
            <span className="text-micro text-brand-text-subtle">Pengelola Sistem</span>
          </div>
          <h1 className="mt-1 text-heading-l font-extrabold">Selamat Datang, Admin!</h1>
          <p className="mt-1 text-ui text-brand-neutral-300">Awasi seluruh unit, kontrak, pembayaran, dan pengguna lintas pemilik.</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Unit Lintas Pemilik" nilai={`${units.data?.length ?? 0} Unit`} ikon={<FontAwesomeIcon icon={faBuilding} />} />
        <KpiCard label="Kontrak Aktif" nilai={`${kontrakAktif} Kontrak`} tone="success" ikon={<FontAwesomeIcon icon={faFileSignature} />} />
        <KpiCard label="Menunggu Verifikasi" nilai={`${menungguVerifikasi} Bukti`} tone="warning" ikon={<FontAwesomeIcon icon={faMoneyCheckDollar} />} />
        <KpiCard label="Pengguna Terdaftar" nilai={`${pengguna.data?.length ?? 0} Akun`} ikon={<FontAwesomeIcon icon={faUsersGear} />} />
      </div>

      <Outlet />
    </section>
  )
}
