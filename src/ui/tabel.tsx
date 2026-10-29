import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* Kerangka tabel yang dipakai berulang: permukaan, border, gulir mendatar, dan
   gaya kepala yang sama untuk katalog, kontrak, tagihan, dan pengguna.
   `kolomAkhirKanan` menyelaraskan judul kolom terakhir dengan isinya yang biasa
   rata kanan (tombol aksi). */
export function Tabel({
  kolom,
  children,
  className,
  kolomAkhirKanan = false,
}: {
  kolom: string[]
  children: ReactNode
  className?: string
  kolomAkhirKanan?: boolean
}) {
  return (
    <div className={`overflow-x-auto bg-brand-surface ${className ?? ''}`}>
      <table className="w-full text-left text-xs text-brand-text">
        <thead className="border-y border-brand-border bg-brand-bg text-micro font-bold uppercase text-brand-text-muted">
          <tr>
            {kolom.map((judul, indeks) => (
              <th key={judul} className={cn('p-4', kolomAkhirKanan && indeks === kolom.length - 1 && 'text-right')}>{judul}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">{children}</tbody>
      </table>
    </div>
  )
}
