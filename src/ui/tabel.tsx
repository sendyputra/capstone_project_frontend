import type { ReactNode } from 'react'

/* Kerangka tabel yang dipakai berulang: permukaan, border, gulir mendatar, dan
   gaya kepala yang sama untuk katalog, kontrak, tagihan, dan pengguna. */
export function Tabel({ kolom, children, className }: { kolom: string[]; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto bg-brand-surface ${className ?? ''}`}>
      <table className="w-full text-left text-xs text-brand-text">
        <thead className="border-y border-brand-border bg-brand-bg text-micro font-bold uppercase text-brand-text-muted">
          <tr>
            {kolom.map((judul) => <th key={judul} className="p-4">{judul}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">{children}</tbody>
      </table>
    </div>
  )
}
