export function parseAmount(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  const angka = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(',', '.'))
  return Number.isFinite(angka) ? Math.round(angka) : 0
}

export function formatRupiah(value: number | string | null | undefined): string {
  return 'Rp ' + parseAmount(value).toLocaleString('id-ID')
}

export function formatTanggal(value: string | Date): string {
  const tanggal = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(tanggal.getTime())) return '—'
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(tanggal)
}

/* Label bulan untuk kolom tagihan: ERD menyimpan `month` sebagai `YYYY-MM`,
   sedangkan layar menulis "Oktober 2026". Tanggalnya dibangun dalam UTC supaya
   zona waktu peramban tidak menggeser bulan. Nilai yang tidak berbentuk
   `YYYY-MM` diteruskan apa adanya — lebih jujur daripada "Invalid Date". */
export function formatBulan(value: string): string {
  const cocok = /^(\d{4})-(\d{2})$/.exec(value)
  if (!cocok) return value
  const tanggal = new Date(Date.UTC(Number(cocok[1]), Number(cocok[2]) - 1, 1))
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(tanggal)
}

/* Dua inisial pertama untuk avatar bulat — sama seperti purwarupa. */
export function inisial(nama: string): string {
  return nama
    .split(' ')
    .slice(0, 2)
    .map((kata) => kata.charAt(0))
    .join('')
    .toUpperCase()
}
