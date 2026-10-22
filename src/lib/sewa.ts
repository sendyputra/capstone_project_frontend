export function hitungSewa(mulai: string, bulan: number, harga: number): { akhir: string; total: number } {
  const [tahun, bulanAwal, tanggal] = mulai.split('-').map(Number)
  const sasaran = new Date(Date.UTC(tahun, bulanAwal - 1 + bulan, 1))
  const hariTerakhir = new Date(Date.UTC(sasaran.getUTCFullYear(), sasaran.getUTCMonth() + 1, 0)).getUTCDate()
  sasaran.setUTCDate(Math.min(tanggal, hariTerakhir))
  const akhir = sasaran.toISOString().slice(0, 10)
  return { akhir, total: harga * bulan }
}
