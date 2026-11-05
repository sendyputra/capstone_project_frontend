import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* Satu saringan per kolom: teks bebas, atau pilihan tetap untuk kolom status.
   Penyaringan dikerjakan di peramban karena kelima tabel ini sudah memuat
   seluruh baris halaman; server tetap pemilik data. Kolom tanpa entri di
   `saringan` — biasanya kolom aksi — tidak mendapat kotak isian. */
export type Saringan<T> =
  | { jenis?: 'teks'; nilai: (baris: T) => string }
  | { jenis: 'pilihan'; nilai: (baris: T) => string; pilihan: readonly string[] }

export function TabelSaring<T>({
  kolom,
  baris,
  saringan,
  kolomAkhirKanan = false,
  kosong = 'Tidak ada baris yang cocok.',
  children,
}: {
  kolom: string[]
  baris: T[]
  saringan: Saringan<T>[]
  kolomAkhirKanan?: boolean
  kosong?: string
  children: (tampil: T[]) => ReactNode
}) {
  const [kata, setKata] = useState<string[]>(() => saringan.map(() => ''))

  function ubah(indeks: number, nilai: string) {
    setKata((lama) => lama.map((isi, i) => (i === indeks ? nilai : isi)))
  }

  const tampil = baris.filter((item) =>
    saringan.every((aturan, indeks) => {
      const kunci = (kata[indeks] ?? '').trim().toLowerCase()
      if (!kunci) return true
      return aturan.nilai(item).toLowerCase().includes(kunci)
    }),
  )

  if (!tampil.length) {
    return (
      <p className="rounded-xl border border-brand-border bg-brand-surface p-6 text-center text-ui text-brand-text-muted">{kosong}</p>
    )
  }

  return (
    <div className="overflow-x-auto bg-brand-surface">
      <table className="w-full text-left text-xs text-brand-text">
        <thead className="border-y border-brand-border bg-brand-bg text-micro font-bold uppercase text-brand-text-muted">
          <tr>
            {kolom.map((judul, indeks) => (
              <th key={judul} className={cn('p-4', kolomAkhirKanan && indeks === kolom.length - 1 && 'text-right')}>
                {judul}
              </th>
            ))}
          </tr>
          <tr className="border-b border-brand-border">
            {kolom.map((judul, indeks) => {
              const aturan = saringan[indeks]
              return (
                <th key={judul} className="px-2 pb-3 font-normal normal-case">
                  {aturan?.jenis === 'pilihan' ? (
                    <select
                      aria-label={`Saring ${judul}`}
                      value={kata[indeks] ?? ''}
                      onChange={(e) => ubah(indeks, e.target.value)}
                      className="w-full min-w-0 rounded-md border border-brand-border bg-brand-surface px-2 py-1 text-ui text-brand-text"
                    >
                      <option value="">Semua</option>
                      {aturan.pilihan.map((nilai) => (
                        <option key={nilai} value={nilai}>{nilai}</option>
                      ))}
                    </select>
                  ) : aturan ? (
                    <input
                      type="search"
                      aria-label={`Saring ${judul}`}
                      value={kata[indeks] ?? ''}
                      onChange={(e) => ubah(indeks, e.target.value)}
                      className="w-full min-w-0 rounded-md border border-brand-border bg-brand-surface px-2 py-1 text-ui font-normal text-brand-text"
                    />
                  ) : null}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">{children(tampil)}</tbody>
      </table>
    </div>
  )
}
