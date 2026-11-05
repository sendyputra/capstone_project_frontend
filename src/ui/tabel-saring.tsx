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
  urut,
  kolomAkhirKanan = false,
  kosong = 'Tidak ada baris yang cocok.',
  children,
}: {
  kolom: string[]
  baris: T[]
  saringan: Saringan<T>[]
  /* Tiap judul di `banding` menjadi tombol urut; klik pertama menaik, klik
     berikutnya membalik. `banding` selalu ditulis menaik. */
  urut?: {
    banding: Record<string, (a: T, b: T) => number>
    awal?: { judul: string; arah: 'naik' | 'turun' }
  }
  kolomAkhirKanan?: boolean
  kosong?: string
  children: (tampil: T[]) => ReactNode
}) {
  const [kata, setKata] = useState<string[]>(() => saringan.map(() => ''))
  const [sortir, setSortir] = useState<{ judul: string; arah: 'naik' | 'turun' } | null>(urut?.awal ?? null)

  function ubah(indeks: number, nilai: string) {
    setKata((lama) => lama.map((isi, i) => (i === indeks ? nilai : isi)))
  }

  const tersaring = baris.filter((item) =>
    saringan.every((aturan, indeks) => {
      const kunci = (kata[indeks] ?? '').trim().toLowerCase()
      if (!kunci) return true
      return aturan.nilai(item).toLowerCase().includes(kunci)
    }),
  )

  function balikArah(judul: string) {
    setSortir((lama) =>
      lama?.judul === judul ? { judul, arah: lama.arah === 'naik' ? 'turun' : 'naik' } : { judul, arah: 'naik' },
    )
  }

  const pembanding = urut && sortir ? urut.banding[sortir.judul] : undefined
  const tampil = pembanding && sortir
    ? [...tersaring].sort((a, b) => (sortir.arah === 'naik' ? pembanding(a, b) : pembanding(b, a)))
    : tersaring

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
            {kolom.map((judul, indeks) => {
              const bisaUrut = Boolean(urut?.banding[judul])
              const arah = sortir?.judul === judul ? sortir.arah : null
              return (
                <th
                  key={judul}
                  aria-sort={arah ? (arah === 'naik' ? 'ascending' : 'descending') : undefined}
                  className={cn('p-4', kolomAkhirKanan && indeks === kolom.length - 1 && 'text-right')}
                >
                  {bisaUrut ? (
                    <button
                      type="button"
                      onClick={() => balikArah(judul)}
                      aria-label={`Urutkan ${judul} ${arah === 'naik' ? 'menurun' : 'menaik'}`}
                      className="inline-flex items-center gap-1 font-bold uppercase text-brand-text-muted hover:text-brand-text"
                    >
                      {judul}
                      <span aria-hidden="true">{arah === 'naik' ? '▲' : arah === 'turun' ? '▼' : '↕'}</span>
                    </button>
                  ) : (
                    judul
                  )}
                </th>
              )
            })}
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
