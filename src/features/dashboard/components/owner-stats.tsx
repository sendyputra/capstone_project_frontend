import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBuilding, faHouseCircleCheck, faHouseUser, faWallet } from '@fortawesome/free-solid-svg-icons'
import type { Unit } from '@/api/types'
import { KpiCard } from '@/ui/kpi-card'
import { formatRupiah } from '@/lib/format'

export function hitungStatistik(units: Unit[]) {
  const total = units.length
  const tersedia = units.filter((unit) => unit.status === 'Tersedia').length
  const terisi = total - tersedia
  const pendapatan = units.filter((unit) => unit.status === 'Terisi').reduce((jumlah, unit) => jumlah + Number(unit.price), 0)
  return { total, tersedia, terisi, pendapatan }
}

export function OwnerStats({ units }: { units: Unit[] }) {
  const { total, tersedia, terisi, pendapatan } = hitungStatistik(units)

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Total Unit Dikelola" nilai={`${total} Unit`} ikon={<FontAwesomeIcon icon={faBuilding} />} />
      <KpiCard label="Unit Terisi" nilai={`${terisi} Unit`} tone="danger" ikon={<FontAwesomeIcon icon={faHouseUser} />} />
      <KpiCard label="Unit Kosong / Siap Huni" nilai={`${tersedia} Unit`} tone="success" ikon={<FontAwesomeIcon icon={faHouseCircleCheck} />} />
      <KpiCard label="Estimasi Pendapatan/Bln" nilai={formatRupiah(pendapatan)} ikon={<FontAwesomeIcon icon={faWallet} />} />
    </div>
  )
}
