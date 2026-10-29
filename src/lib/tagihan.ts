import type { ContractRow, PaymentRow } from '@/api/types'
import { hitungBulanSewa } from '@/lib/sewa'

/* Satu baris tagihan = satu bulan sewa sebuah kontrak. Bulan yang belum dibayar
   tidak punya baris di tabel `payments` — backend tidak menyimpan status "belum
   bayar" — jadi daftar tagihan diturunkan dari kontrak dan baris pembayaran
   dicocokkan per bulan. */
export type Tagihan = {
  kunci: string
  contract_id: number
  month: string
  amount: number
  status: PaymentRow['status'] | 'Belum Bayar'
  proof_url: string
  unit_title: string
}

/* `month` dan tanggal ERD memakai `YYYY-MM`/`YYYY-MM-DD`; bulan cukup dipotong
   dari tanggalnya, tanpa zona waktu yang bisa menggeser bulan. */
export const BENTUK_BULAN = /^\d{4}-(0[1-9]|1[0-2])$/

/* Backend membalas pembayaran urut `created_at`, jadi bulan lintas kontrak
   datang acak. Tampilan mengelompokkan per kontrak (urutan kemunculan pertama)
   dan menaruh bulan terbaru di atas. Setiap kelompok diurutkan sendiri, bukan
   seluruh daftar, supaya kontrak tidak saling menyela. */
export function urutkanTagihan<T extends { contract_id: number; month: string }>(daftar: T[]): T[] {
  const perKontrak = new Map<number, T[]>()
  for (const baris of daftar) {
    const kelompok = perKontrak.get(baris.contract_id)
    if (kelompok) kelompok.push(baris)
    else perKontrak.set(baris.contract_id, [baris])
  }
  return [...perKontrak.values()].flatMap((kelompok) => kelompok.sort((a, b) => b.month.localeCompare(a.month)))
}

function bulanDari(tanggal: string) {
  return tanggal.slice(0, 7)
}

/* Satu bulan bisa punya lebih dari satu baris pembayaran: unggahan ulang
   menambah baris, tidak menimpa yang lama. Yang mewakili keadaan sekarang adalah
   baris ber-`id` terbesar — tanpa ini, `Ditolak` dari unggahan lama tetap
   menutupi unggahan barunya, dan `Lunas` bisa tertutup baris yang lebih tua. */
export function pembayaranTerbaru(pembayaran: PaymentRow[]): Map<string, PaymentRow> {
  const peta = new Map<string, PaymentRow>()
  for (const baris of pembayaran) {
    const kunci = `${baris.contract_id}-${bulanDari(baris.month)}`
    const tersimpan = peta.get(kunci)
    if (!tersimpan || baris.id > tersimpan.id) peta.set(kunci, baris)
  }
  return peta
}

/* Murni dan bebas jam: `hariIni` datang dari pemanggil supaya hasilnya bisa
   diuji tanpa memalsukan waktu sistem. Tagihan berhenti di bulan berjalan —
   bulan yang belum dijalani belum pantas ditagih — dan setelah masa sewa habis. */
export function susunTagihan(kontrak: ContractRow[], pembayaran: PaymentRow[], hariIni: string): Tagihan[] {
  const batas = bulanDari(hariIni)
  const terbaru = pembayaranTerbaru(pembayaran)
  const hasil: Tagihan[] = []
  for (const k of kontrak) {
    if (k.status !== 'Aktif') continue
    const mulai = bulanDari(k.start_date)
    const akhir = bulanDari(k.end_date)
    /* Adaptor kontrak sengaja mengirim `start_date: ''` untuk tanggal yang tak
       terbaca. Tanpa penjagaan, `split('-').map(Number)` menghasilkan `NaN`,
       `Date.UTC` menghasilkan tanggal tak sah, dan `.toISOString()` melempar —
       satu kontrak cacat akan menggagalkan seluruh daftar. Kontrak tanpa masa
       sewa yang terbaca memang tidak bisa ditagih, jadi dilewati. */
    if (!BENTUK_BULAN.test(mulai) || !BENTUK_BULAN.test(akhir)) continue
    /* Jumlah baris mengikuti aturan yang sama dengan biaya bulanan kontrak
       (`hitungBulanSewa`), bukan jumlah bulan kalender yang tersentuh rentang.
       Kalau tidak, 15 Nov – 14 Feb ditagih empat kali padahal nilainya tiga
       bulan, dan jumlah tagihan melebihi `total_price`. Batas 120 bulan (10
       tahun) hanya pengaman agar data cacat tidak membuat perulangan panjang. */
    const jumlahBulan = Math.min(hitungBulanSewa(k.start_date, k.end_date), 120)
    const [tahunAwal, bulanAwal] = mulai.split('-').map(Number)
    for (let i = 0; i < jumlahBulan; i += 1) {
      const d = new Date(Date.UTC(tahunAwal, bulanAwal - 1 + i, 1))
      const bulan = d.toISOString().slice(0, 7)
      if (bulan > batas) break
      const cocok = terbaru.get(`${k.id}-${bulan}`)
      hasil.push({
        kunci: `${k.id}-${bulan}`,
        contract_id: k.id,
        month: bulan,
        /* Jumlah dari baris pembayaran bila ada (nilai yang benar-benar
           ditagih), selain itu biaya bulanan kontrak. */
        amount: cocok?.amount ?? k.monthly,
        status: cocok?.status ?? 'Belum Bayar',
        proof_url: cocok?.proof_url ?? '',
        unit_title: k.unit_title,
      })
    }
  }
  return hasil
}
