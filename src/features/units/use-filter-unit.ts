import { useMemo, useState } from 'react'
import type { UnitRow } from '@/api/types'

export type FilterUnit = {
  cari: string
  setCari: (nilai: string) => void
  tipe: string
  setTipe: (nilai: string) => void
  status: string
  setStatus: (nilai: string) => void
  reset: () => void
  saring: (daftar: UnitRow[]) => UnitRow[]
}

/* Satu keadaan filter untuk dua tempat: kartu di dalam hero dan seksi katalog.
   Purwarupa menaruh isiannya di hero tetapi hasilnya di seksi di bawahnya, jadi
   keadaannya diangkat ke halaman, bukan disimpan di dalam salah satu seksi. */
export function useFilterUnit(): FilterUnit {
  const [cari, setCari] = useState('')
  const [tipe, setTipe] = useState('Semua')
  const [status, setStatus] = useState('Semua')

  return useMemo(
    () => ({
      cari,
      setCari,
      tipe,
      setTipe,
      status,
      setStatus,
      reset() {
        setCari('')
        setTipe('Semua')
        setStatus('Semua')
      },
      saring(daftar) {
        const kata = cari.trim().toLowerCase()
        return daftar.filter((unit) => {
          const cocokCari = `${unit.name} ${unit.address}`.toLowerCase().includes(kata)
          const cocokTipe = tipe === 'Semua' || unit.type === tipe
          const cocokStatus = status === 'Semua' || unit.status === status
          return cocokCari && cocokTipe && cocokStatus
        })
      },
    }),
    [cari, tipe, status],
  )
}
