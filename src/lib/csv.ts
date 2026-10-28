export type NilaiCsv = string | number | null | undefined

/* Excel versi Indonesia membaca pemisah titik koma, dan BOM di awal berkas
   membuat huruf beraksen tetap tampil benar saat dibuka langsung. */
export function susunCsv(kolom: string[], baris: NilaiCsv[][]): string {
  const sel = (nilai: NilaiCsv) => {
    const mentah = nilai == null ? '' : String(nilai)
    /* Excel mengeksekusi sel yang diawali `=`, `+`, `-`, `@`, tab, atau CR
       sebagai formula. Awalan kutip tunggal membuatnya terbaca sebagai teks. */
    const teks = /^[=+\-@\t\r]/.test(mentah) ? `'${mentah}` : mentah
    return /[";\r\n]/.test(teks) ? `"${teks.replace(/"/g, '""')}"` : teks
  }
  return `\uFEFF${[kolom, ...baris].map((isi) => isi.map(sel).join(';')).join('\r\n')}`
}

export function unduhCsv(nama: string, kolom: string[], baris: NilaiCsv[][]) {
  const berkas = new Blob([susunCsv(kolom, baris)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(berkas)
  const tautan = document.createElement('a')
  tautan.href = url
  tautan.download = nama
  tautan.rel = 'noopener'
  document.body.append(tautan)
  tautan.click()
  tautan.remove()
  URL.revokeObjectURL(url)
}
