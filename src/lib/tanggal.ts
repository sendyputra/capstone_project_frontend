/* Zona waktu acuan tagihan. Penyewa, pemilik, dan backend berada di WIB, jadi
   "bulan berjalan" yang dipakai layar adalah bulan kalender WIB — bukan bulan
   UTC, yang baru berganti tujuh jam kemudian dan menyembunyikan tagihan bulan
   baru selama tujuh jam pertama tiap bulan. */
export const ZONA_WAKTU = 'Asia/Jakarta'

/* Tanggal kalender hari ini (`YYYY-MM-DD`) menurut `ZONA_WAKTU`. Murni terhadap
   `saat`, jadi bisa diuji tanpa memalsukan jam sistem: `new Date()` hanya nilai
   bawaan, bukan sumber kebenaran. Tanggal yang tidak sah tetap melempar seperti
   `Intl` biasa — pemanggilnya selalu `new Date()`. */
export function tanggalHariIni(saat: Date = new Date()): string {
  const bagian = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA_WAKTU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(saat)
  const ambil = (jenis: string) => bagian.find((potongan) => potongan.type === jenis)?.value ?? ''
  return `${ambil('year')}-${ambil('month')}-${ambil('day')}`
}

/* Tanggal kalender dari nilai API. Laravel menyerialkan kolom `date` sebagai
   tengah malam UTC (`2026-10-01` menjadi `2026-09-30T17:00:00.000000Z`), jadi
   string apa adanya harus dikembalikan ke tanggal WIB; memotongnya langsung
   menggeser hari dan bulan. Nilai yang sudah `YYYY-MM-DD` atau tak terbaca
   diteruskan apa adanya. */
export function tanggalKalender(nilai: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(nilai)) return nilai
  const tanggal = new Date(nilai)
  return Number.isNaN(tanggal.getTime()) ? nilai : tanggalHariIni(tanggal)
}
