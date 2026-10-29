import type { PaymentRow } from '@/api/types'
import { BENTUK_BULAN, pembayaranTerbaru } from '@/lib/tagihan'

/* Satu titik = satu bulan tagihan. Grafik pendapatan memakai bentuk ini supaya
   bulan tanpa pembayaran tetap tampil sebagai nol, bukan bolong. */
export type TitikPendapatan = { bulan: string; jumlah: number }

const JUMLAH_BULAN = 6

/* Jumlah `Lunas` per bulan, urut naik, selalu tepat `jumlahBulan` baris berakhir
   di `bulanAkhir`. Baris yang bulan-nya cacat dibuang lebih dulu; tanpa itu,
   `pembayaranTerbaru` mengunci baris cacat dan `Date.UTC` menghasilkan bulan
   `NaN`. Satu kontrak-bulan hanya diwakili baris ber-`id` terbesar — aturan yang
   sama dengan tagihan, karena unggahan ulang menambah baris, tidak menimpa. */
export function hitungPendapatanBulanan(pembayaran: PaymentRow[], bulanAkhir: string, jumlahBulan: number = JUMLAH_BULAN): TitikPendapatan[] {
  const terpakai = [...pembayaranTerbaru(pembayaran.filter((baris) => BENTUK_BULAN.test(baris.month))).values()]
  const [tahun, bulan] = bulanAkhir.split('-').map(Number)

  const hasil: TitikPendapatan[] = []
  for (let i = jumlahBulan - 1; i >= 0; i -= 1) {
    const kunci = new Date(Date.UTC(tahun, bulan - 1 - i, 1)).toISOString().slice(0, 7)
    const jumlah = terpakai
      .filter((baris) => baris.status === 'Lunas' && baris.month === kunci)
      .reduce((total, baris) => total + Number(baris.amount), 0)
    hasil.push({ bulan: kunci, jumlah })
  }
  return hasil
}

/* Label sumbu batang: "Jun", "Des". Bulan dibangun dalam UTC supaya zona waktu
   peramban tidak menggeser bulannya, dan nilai cacat diteruskan apa adanya. */
export function labelBulanSingkat(bulan: string): string {
  if (!BENTUK_BULAN.test(bulan)) return bulan
  const [tahun, nomor] = bulan.split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(tahun, nomor - 1, 1)))
}
