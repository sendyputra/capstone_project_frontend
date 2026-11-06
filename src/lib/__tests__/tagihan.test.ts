import { describe, expect, it } from 'vitest'
import type { ContractRow, PaymentRow } from '@/api/types'
import { susunTagihan, urutkanTagihan, kelompokkanSewa } from '@/lib/tagihan'

const kontrak: ContractRow = {
  id: 1, unit_id: 2, tenant_id: 3, start_date: '2026-11-15', end_date: '2027-02-14',
  total_price: 4_500_000, status: 'Aktif', renter_name: 'Siti', unit_title: 'Kos A',
  owner_name: 'Pak Wahyu', term: '3 bulan', monthly: 1_500_000,
}

const bayar: PaymentRow = {
  id: 9, contract_id: 1, month: '2026-12', amount: 1_500_000, status: 'Lunas',
  proof_url: 'x', renter_name: 'Siti', unit_title: 'Kos A',
}

describe('susunTagihan', () => {
  it('menurunkan bulan dari kontrak dan menandai yang belum dibayar', () => {
    const hasil = susunTagihan([kontrak], [bayar], '2027-01-10')
    expect(hasil.map((t) => t.month)).toEqual(['2026-11', '2026-12', '2027-01'])
    expect(hasil[0].status).toBe('Belum Bayar')
    expect(hasil[1].status).toBe('Lunas')
  })

  it('berhenti setelah masa sewa habis walau hari ini lebih jauh', () => {
    const hasil = susunTagihan([kontrak], [], '2027-06-01')
    expect(hasil.map((t) => t.month)).toEqual(['2026-11', '2026-12', '2027-01'])
  })

  /* Kontrak 15 Nov 2026 – 14 Feb 2027 bernilai tiga bulan sewa (4.500.000), dan
     `monthly` 1.500.000 berasal dari aturan yang sama. Menagih tiap bulan
     kalender yang tersentuh akan menghasilkan empat baris dan 6.000.000 —
     menagih lebih dari nilai kontrak. */
  it('menagih sebanyak masa sewa, bukan tiap bulan kalender yang tersentuh', () => {
    const hasil = susunTagihan([kontrak], [], '2027-06-01')
    expect(hasil).toHaveLength(3)
    expect(hasil.reduce((jumlah, t) => jumlah + t.amount, 0)).toBe(kontrak.total_price)
  })

  it('mengabaikan kontrak yang belum aktif', () => {
    expect(susunTagihan([{ ...kontrak, status: 'Menunggu' }], [], '2027-01-10')).toEqual([])
  })

  /* Riwayat sewa memakai penyusun yang sama: kontrak yang sudah selesai tetap
     menampilkan bulannya, tetapi pengajuan yang belum pernah berjalan tidak
     pernah punya tagihan. */
  it('menyertakan kontrak lampau bila diminta, tanpa mengikutkan pengajuan', () => {
    expect(susunTagihan([{ ...kontrak, status: 'Selesai' }], [], '2027-01-10')).toEqual([])
    expect(
      susunTagihan([{ ...kontrak, status: 'Dibatalkan', ended_at: '2026-12-20' }], [], '2027-01-10', { semuaKontrak: true }).map(
        (t) => t.month,
      ),
    ).toEqual(['2026-11', '2026-12'])
    expect(susunTagihan([{ ...kontrak, status: 'Menunggu' }], [], '2027-01-10', { semuaKontrak: true })).toEqual([])
  })

  /* ADR 0002: pengajuan yang ditolak tidak punya `ended_at`, jadi tidak punya
     satu bulan pun untuk ditagih — itulah pembedanya dari sewa yang dihentikan. */
  it('tidak menagih pengajuan yang ditolak', () => {
    expect(susunTagihan([{ ...kontrak, status: 'Dibatalkan' }], [], '2027-01-10', { semuaKontrak: true })).toEqual([])
    expect(susunTagihan([{ ...kontrak, status: 'Dibatalkan' }], [], '2027-01-10')).toEqual([])
  })

  /* Tanggal penghentian memotong tagihan lebih awal dari tanggal selesai yang
     disepakati; biaya bulanan tetap memakai nilai kontrak penuh. */
  it('berhenti menagih pada tanggal penghentian', () => {
    const hasil = susunTagihan(
      [{ ...kontrak, status: 'Selesai', ended_at: '2026-12-20' }],
      [],
      '2027-06-01',
      { semuaKontrak: true },
    )
    expect(hasil.map((t) => t.month)).toEqual(['2026-11', '2026-12'])
    expect(hasil.map((t) => t.amount)).toEqual([1_500_000, 1_500_000])
  })

  /* Pembayaran bertambah, tidak ditimpa: unggahan ulang setelah ditolak
     meninggalkan baris lama. Yang mewakili keadaan sekarang adalah `id`
     terbesar — urutan kedatangan larik tidak boleh menentukan hasilnya. */
  it('memakai baris pembayaran terbaru saat satu bulan punya beberapa baris', () => {
    const ditolak: PaymentRow = { ...bayar, id: 10, month: '2026-12', status: 'Ditolak', proof_url: '/bukti/lama.jpg' }
    const menunggu: PaymentRow = { ...bayar, id: 11, month: '2026-12', status: 'Menunggu Verifikasi', proof_url: '/bukti/baru.jpg' }

    for (const larik of [[ditolak, menunggu], [menunggu, ditolak]]) {
      const desember = susunTagihan([kontrak], larik, '2027-01-10').find((t) => t.month === '2026-12')
      expect(desember).toMatchObject({ status: 'Menunggu Verifikasi', proof_url: '/bukti/baru.jpg' })
    }
  })

  it('baris Lunas yang lebih baru tidak tertutup baris lama', () => {
    const menunggu: PaymentRow = { ...bayar, id: 10, month: '2026-12', status: 'Menunggu Verifikasi' }
    const lunas: PaymentRow = { ...bayar, id: 12, month: '2026-12', status: 'Lunas' }
    const desember = susunTagihan([kontrak], [menunggu, lunas], '2027-01-10').find((t) => t.month === '2026-12')
    expect(desember?.status).toBe('Lunas')
  })

  /* Adaptor kontrak sengaja mengirim `start_date: ''` untuk tanggal tak terbaca.
     Kontrak seperti itu tidak bisa ditagih, tetapi juga tidak boleh menggagalkan
     seluruh daftar tagihan penyewa lain. */
  it('melewati kontrak dengan tanggal mulai tak terbaca, tanpa melempar', () => {
    expect(susunTagihan([{ ...kontrak, start_date: '' }], [], '2027-01-10')).toEqual([])
    expect(susunTagihan([{ ...kontrak, start_date: 'bukan-tanggal' }], [], '2027-01-10')).toEqual([])
    expect(susunTagihan([{ ...kontrak, start_date: '2026-13-01' }], [], '2027-01-10')).toEqual([])
  })
})

/* Backend membalas pembayaran urut `created_at`, jadi bulan lintas kontrak
   datang acak. Tampilan harus kronologis menurun per kontrak. */
describe('urutkanTagihan', () => {
  it('mengurutkan bulan menurun dan memakai kontrak sebagai pemisah', () => {
    const baris = [
      { contract_id: 2, month: '2026-03' },
      { contract_id: 1, month: '2026-02' },
      { contract_id: 2, month: '2026-09' },
      { contract_id: 1, month: '2026-07' },
    ]
    expect(urutkanTagihan(baris).map((b) => `${b.contract_id}-${b.month}`)).toEqual([
      '2-2026-09',
      '2-2026-03',
      '1-2026-07',
      '1-2026-02',
    ])
  })

  it('tidak mengubah daftar kosong dan tetap menangani tanggal penuh', () => {
    expect(urutkanTagihan([])).toEqual([])
    expect(urutkanTagihan([{ contract_id: 1, month: '2026-02-01' }, { contract_id: 1, month: '2026-02-20' }]).map((b) => b.month)).toEqual([
      '2026-02-20',
      '2026-02-01',
    ])
  })
})

/* Penyewa melihat tiga keadaan berbeda. `Aktif` yang tanggal selesainya sudah
   lewat tetap masuk riwayat: backend tidak menutup kontrak sendiri, jadi tanpa
   aturan ini sewa yang sudah habis akan tampil sebagai sewa berjalan selamanya. */
describe('kelompokkanSewa', () => {
  it('memisahkan pengajuan, sewa berjalan, dan riwayat', () => {
    const { pengajuan, berjalan, riwayat } = kelompokkanSewa(
      [
        { ...kontrak, id: 1, status: 'Menunggu' },
        { ...kontrak, id: 2, status: 'Aktif', end_date: '2027-02-14' },
        { ...kontrak, id: 3, status: 'Aktif', end_date: '2026-10-31' },
        { ...kontrak, id: 4, status: 'Selesai' },
        { ...kontrak, id: 5, status: 'Dibatalkan' },
      ],
      '2026-11-01',
    )
    expect(pengajuan.map((k) => k.id)).toEqual([1])
    expect(berjalan.map((k) => k.id)).toEqual([2])
    expect(riwayat.map((k) => k.id)).toEqual([3, 4, 5])
  })

  it('menghitung selesai tepat hari ini sebagai sewa berjalan', () => {
    expect(kelompokkanSewa([{ ...kontrak, end_date: '2026-11-01' }], '2026-11-01').berjalan).toHaveLength(1)
  })

  /* Tanggal tak terbaca tidak boleh membuang kontrak ke riwayat: penyewa akan
     mengira sewanya sudah berakhir padahal datanya yang cacat. */
  it('menahan kontrak bertanggal tak terbaca di sewa berjalan', () => {
    expect(kelompokkanSewa([{ ...kontrak, end_date: '' }], '2026-11-01').berjalan).toHaveLength(1)
  })
})
