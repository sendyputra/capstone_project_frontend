export type HasilKtp = { nik: string; nama: string; yakin: boolean }

const POLA_NIK = /\b(\d{16})\b/
const PANJANG_NIK = 16

/* OCR KTP lebih sering benar pada label daripada pada tata letak, jadi nilai
   diambil dari baris yang diawali labelnya (`NIK : ...`, `Nama : ...`). */
function nilaiSetelah(teks: string, label: string): string {
  const pola = new RegExp(`^\\s*${label}\\s*[:：]\\s*(.+)$`, 'i')
  for (const baris of teks.split('\n')) {
    const cocok = pola.exec(baris)
    if (cocok) return cocok[1].replace(/[^\w\s]/g, '').trim()
  }
  return ''
}

/* Cadangan bila regex 16 digit berurutan tidak cocok (mis. OCR menyisipkan
   spasi: `3578 1234 5678 0001`, atau huruf menggantikan angka). Nilai label
   dirapikan menjadi digit saja dan hanya diterima bila tepat 16 digit —
   kalau tidak, NIK dikembalikan kosong agar pengguna mengisi manual. */
function nikBerlabel(teks: string): string {
  const digit = nilaiSetelah(teks, 'NIK').replace(/\D/g, '')
  return digit.length === PANJANG_NIK ? digit : ''
}

/* Tesseract dimuat dinamis agar tidak ikut bundel awal; berkas KTP dibaca
   sepenuhnya di peramban — tidak ada unggahan berkas maupun panggilan API.
   Kegagalan apa pun dikembalikan sebagai hasil kosong supaya halaman
   menawarkan isian manual. */
export async function bacaKtp(berkas: File): Promise<HasilKtp> {
  const { recognize } = await import('tesseract.js')
  const hasil = await recognize(berkas, 'ind')
  const teks = hasil.data.text
  const nik = POLA_NIK.exec(teks)?.[1] ?? nikBerlabel(teks)
  const nama = nilaiSetelah(teks, 'Nama').toUpperCase()
  return { nik, nama, yakin: Boolean(nik) && Boolean(nama) }
}
