export type HasilKtp = { nik: string; nama: string; yakin: boolean }

const POLA_NIK = /\b(\d{16})\b/

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

/* Tesseract dimuat dinamis agar tidak ikut bundel awal; berkas KTP dibaca
   sepenuhnya di peramban — tidak ada unggahan berkas maupun panggilan API.
   Kegagalan apa pun dikembalikan sebagai hasil kosong supaya halaman
   menawarkan isian manual. */
export async function bacaKtp(berkas: File): Promise<HasilKtp> {
  const { recognize } = await import('tesseract.js')
  const hasil = await recognize(berkas, 'ind')
  const teks = hasil.data.text
  const nik = POLA_NIK.exec(teks)?.[1] ?? nilaiSetelah(teks, 'NIK')
  const nama = nilaiSetelah(teks, 'Nama').toUpperCase()
  return { nik, nama, yakin: Boolean(nik) && Boolean(nama) }
}
