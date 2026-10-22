import type { ContractRow, PaymentRow } from '@/api/types'

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
function bulanDari(tanggal: string) {
  return tanggal.slice(0, 7)
}

/* Murni dan bebas jam: `hariIni` datang dari pemanggil supaya hasilnya bisa
   diuji tanpa memalsukan waktu sistem. Tagihan berhenti di bulan berjalan —
   bulan yang belum dijalani belum pantas ditagih — dan di bulan `end_date`. */
export function susunTagihan(kontrak: ContractRow[], pembayaran: PaymentRow[], hariIni: string): Tagihan[] {
  const batas = bulanDari(hariIni)
  const hasil: Tagihan[] = []
  for (const k of kontrak) {
    if (k.status !== 'Aktif') continue
    const mulai = bulanDari(k.start_date)
    const akhir = bulanDari(k.end_date)
    const [tahunAwal, bulanAwal] = mulai.split('-').map(Number)
    /* Batas 120 bulan (10 tahun) hanya pengaman agar data cacat tidak membuat
       perulangan tak berujung; masa sewa normal berhenti jauh sebelumnya. */
    for (let i = 0; i < 120; i += 1) {
      const d = new Date(Date.UTC(tahunAwal, bulanAwal - 1 + i, 1))
      const bulan = d.toISOString().slice(0, 7)
      if (bulan > akhir || bulan > batas) break
      const cocok = pembayaran.find((p) => p.contract_id === k.id && bulanDari(p.month) === bulan)
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
