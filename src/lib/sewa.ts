export function hitungSewa(mulai: string, bulan: number, harga: number): { akhir: string; total: number } {
  const [tahun, bulanAwal, tanggal] = mulai.split('-').map(Number)
  const sasaran = new Date(Date.UTC(tahun, bulanAwal - 1 + bulan, 1))
  const hariTerakhir = new Date(Date.UTC(sasaran.getUTCFullYear(), sasaran.getUTCMonth() + 1, 0)).getUTCDate()
  sasaran.setUTCDate(Math.min(tanggal, hariTerakhir))
  const akhir = sasaran.toISOString().slice(0, 10)
  return { akhir, total: harga * bulan }
}

/* Tahun, bulan, dan tanggal dari `YYYY-MM-DD` (boleh diikuti sisa waktu).
   Dibaca sebagai potongan teks, bukan lewat `new Date`, supaya zona waktu
   tidak pernah menggeser tanggalnya. Bentuk lain — termasuk string kosong
   yang dikirim adaptor untuk tanggal tak terbaca — menghasilkan `undefined`. */
function bagianTanggal(tanggal: string): [tahun: number, bulan: number, hari: number] | undefined {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})/.exec(tanggal)
  if (!cocok) return undefined
  const tahun = Number(cocok[1])
  const bulan = Number(cocok[2])
  const hari = Number(cocok[3])
  if (bulan < 1 || bulan > 12 || hari < 1 || hari > 31) return undefined
  return [tahun, bulan, hari]
}

/* Berapa bulan sewa yang dibayar untuk rentang `mulai`–`akhir`. Satu aturan
   untuk dua pemakai: adaptor kontrak menurunkan biaya bulanan dari
   `total_price` dengannya, dan `susunTagihan` memakainya untuk menentukan
   berapa baris tagihan — dua aturan berbeda membuat jumlah tagihan tidak pernah
   sama dengan nilai kontrak.

   Sisa hari di bulan terakhir dibulatkan ke atas hanya bila tanggal akhir lebih
   besar dari tanggal mulai: 1 Sep 2026 – 28 Feb 2027 adalah enam bulan (sisa
   hari di bulan keenam ikut dibayar), sedangkan 15 Nov 2026 – 14 Feb 2027
   adalah tiga bulan penuh tanpa sisa. Tanggal tak terbaca menghasilkan 0. */
export function hitungBulanSewa(mulai: string, akhir: string): number {
  const a = bagianTanggal(mulai)
  const b = bagianTanggal(akhir)
  if (!a || !b) return 0
  const selisih = (b[0] - a[0]) * 12 + (b[1] - a[1])
  return Math.max(1, selisih + (b[2] > a[2] ? 1 : 0))
}
