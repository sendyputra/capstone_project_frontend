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

/* Dua inisial pertama untuk avatar bulat — sama seperti purwarupa. */
export function inisial(nama: string): string {
  return nama
    .split(' ')
    .slice(0, 2)
    .map((kata) => kata.charAt(0))
    .join('')
    .toUpperCase()
}
