export type HasilKtp = { nik: string; nama: string; yakin: boolean }

const POLA_NIK = /\b(\d{16})\b/
const PANJANG_NIK = 16

/* Kode provinsi pada NIK mengikuti kode BPS. OCR sering salah pada dua digit
   pertama karena pola latar KTP, sedangkan nama provinsi tercetak besar dan
   mudah dibaca — jadi kode diambil dari nama, bukan dari angka yang terbaca. */
const PROVINSI: [nama: string, kode: string][] = [
  ['ACEH', '11'],
  ['SUMATERA UTARA', '12'],
  ['SUMATERA BARAT', '13'],
  ['RIAU', '14'],
  ['JAMBI', '15'],
  ['SUMATERA SELATAN', '16'],
  ['BENGKULU', '17'],
  ['LAMPUNG', '18'],
  ['KEPULAUAN BANGKA BELITUNG', '19'],
  ['KEPULAUAN RIAU', '21'],
  ['DKI JAKARTA', '31'],
  ['JAWA BARAT', '32'],
  ['JAWA TENGAH', '33'],
  ['DI YOGYAKARTA', '34'],
  ['JAWA TIMUR', '35'],
  ['BANTEN', '36'],
  ['BALI', '51'],
  ['NUSA TENGGARA BARAT', '52'],
  ['NUSA TENGGARA TIMUR', '53'],
  ['KALIMANTAN BARAT', '61'],
  ['KALIMANTAN TENGAH', '62'],
  ['KALIMANTAN SELATAN', '63'],
  ['KALIMANTAN TIMUR', '64'],
  ['KALIMANTAN UTARA', '65'],
  ['SULAWESI UTARA', '71'],
  ['SULAWESI TENGAH', '72'],
  ['SULAWESI SELATAN', '73'],
  ['SULAWESI TENGGARA', '74'],
  ['GORONTALO', '75'],
  ['SULAWESI BARAT', '76'],
  ['MALUKU UTARA', '82'],
  ['MALUKU', '81'],
  ['PAPUA BARAT DAYA', '96'],
  ['PAPUA BARAT', '92'],
  ['PAPUA PEGUNUNGAN', '95'],
  ['PAPUA TENGAH', '94'],
  ['PAPUA SELATAN', '93'],
  ['PAPUA', '91'],
]

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

function provinsiDari(teks: string): string {
  const bersih = teks
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
  for (const [nama, kode] of PROVINSI) {
    if (bersih.includes(nama)) return kode
  }
  return ''
}

/* NIK menyimpan tanggal lahir sebagai DDMMYY pada digit ke-7 sampai ke-12.
   Perempuan ditandai dengan tanggal + 40, sesuai aturan pencatatan sipil. */
function tanggalLahir(teks: string, perempuan: boolean): string {
  for (const baris of teks.split('\n')) {
    if (!/LAHIR/i.test(baris)) continue
    const cocok = /(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{4})/.exec(baris)
    if (!cocok) continue
    const hari = Number(cocok[1]) + (perempuan ? 40 : 0)
    const bulan = Number(cocok[2])
    if (hari < 1 || hari > 71 || bulan < 1 || bulan > 12) continue
    return `${String(hari).padStart(2, '0')}${String(bulan).padStart(2, '0')}${cocok[3].slice(2)}`
  }
  return ''
}

/* Kandidat diambil dari baris berlabel NIK. Bila OCR menyisipkan satu digit
   (panjang 17), setiap kemungkinan penghapusan diuji dan yang tanggalnya paling
   cocok dengan tanggal lahir yang dipilih. */
function kandidatNik(teks: string): string[] {
  const hasil: string[] = []
  for (const baris of teks.split('\n')) {
    if (!/NIK/i.test(baris)) continue
    const digit = baris.replace(/\D/g, '')
    if (digit.length === PANJANG_NIK) hasil.push(digit)
    if (digit.length === PANJANG_NIK + 1) {
      for (let i = 0; i < digit.length; i += 1) hasil.push(digit.slice(0, i) + digit.slice(i + 1))
    }
    /* Satu digit kadang terbaca sebagai huruf (`040b84`). Setiap kemungkinan
       penyisipan diuji, lalu yang tanggalnya cocok dengan tanggal lahir dipilih
       oleh `nikTerkoreksi`. */
    if (digit.length === PANJANG_NIK - 1) {
      for (let i = 0; i <= digit.length; i += 1) {
        for (let angka = 0; angka <= 9; angka += 1) {
          hasil.push(digit.slice(0, i) + String(angka) + digit.slice(i))
        }
      }
    }
  }
  if (hasil.length === 0) {
    const cocok = POLA_NIK.exec(teks)?.[1]
    if (cocok) hasil.push(cocok)
  }
  return [...new Set(hasil)]
}

/* NIK utuh: kode provinsi (dari nama provinsi) + empat digit wilayah + tanggal
   lahir (dari baris tempat/tanggal lahir) + empat digit urutan. Hanya dipakai
   bila tanggal hasil OCR pada NIK masih mirip tanggal lahir — minimal lima dari
   enam digit sama — supaya koreksi tidak menutupi salah baca yang lebih besar. */
function nikTerkoreksi(teks: string, provinsi: string, tanggal: string): string {
  if (!provinsi || !tanggal) return ''
  const hasil = kandidatNik(teks).map((kandidat) => {
    const terbaca = kandidat.slice(6, 12)
    let skor = 0
    for (let i = 0; i < tanggal.length; i += 1) {
      if (terbaca[i] === tanggal[i]) skor += 1
    }
    return { nik: `${provinsi}${kandidat.slice(2, 6)}${tanggal}${kandidat.slice(12)}`, skor }
  })
  if (hasil.length === 0) return ''
  const skorMaks = Math.max(...hasil.map((baris) => baris.skor))
  const terbaik = [...new Set(hasil.filter((baris) => baris.skor === skorMaks).map((baris) => baris.nik))]
  return skorMaks >= 5 && terbaik.length === 1 ? terbaik[0] : ''
}

/* Tesseract kesulitan membaca teks hitam di atas pola guilloche biru. Abu-abu
   lalu peregangan kontras membuat label dan nama terbaca; angkanya tetap
   dikoreksi lewat provinsi dan tanggal lahir di atas. */
async function siapkanGambar(berkas: File): Promise<File | HTMLCanvasElement> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return berkas
  try {
    const bitmap = await createImageBitmap(berkas)
    const kanvas = document.createElement('canvas')
    kanvas.width = bitmap.width
    kanvas.height = bitmap.height
    const konteks = kanvas.getContext('2d')
    if (!konteks) return berkas
    konteks.drawImage(bitmap, 0, 0)
    const gambar = konteks.getImageData(0, 0, kanvas.width, kanvas.height)
    const piksel = gambar.data
    let terendah = 255
    let tertinggi = 0
    for (let i = 0; i < piksel.length; i += 4) {
      const abu = Math.round(0.299 * piksel[i] + 0.587 * piksel[i + 1] + 0.114 * piksel[i + 2])
      piksel[i] = abu
      piksel[i + 1] = abu
      piksel[i + 2] = abu
      if (abu < terendah) terendah = abu
      if (abu > tertinggi) tertinggi = abu
    }
    const rentang = Math.max(1, tertinggi - terendah)
    for (let i = 0; i < piksel.length; i += 4) {
      const nilai = Math.round(((piksel[i] - terendah) * 255) / rentang)
      piksel[i] = nilai
      piksel[i + 1] = nilai
      piksel[i + 2] = nilai
    }
    konteks.putImageData(gambar, 0, 0)
    bitmap.close()
    return kanvas
  } catch {
    return berkas
  }
}

/* Tesseract dimuat dinamis agar tidak ikut bundel awal; berkas KTP dibaca
   sepenuhnya di peramban — tidak ada unggahan berkas maupun panggilan API.
   Kegagalan apa pun dikembalikan sebagai hasil kosong supaya halaman
   menawarkan isian manual. */
export async function bacaKtp(berkas: File): Promise<HasilKtp> {
  const { recognize } = await import('tesseract.js')
  const gambar = await siapkanGambar(berkas)
  const hasil = await recognize(gambar, 'ind')
  const teks = hasil.data.text
  const provinsi = provinsiDari(teks)
  const perempuan = /\bPEREMPUAN\b/i.test(teks)
  const tanggal = tanggalLahir(teks, perempuan)
  /* Bila provinsi dan tanggal lahir terbaca, NIK hanya diterima dari hasil
     koreksi — angka mentah tidak boleh lolos saat koreksinya gagal. Bila
     keduanya tidak terbaca, jatuh ke pembacaan lama: NIK 16 digit berurutan
     atau nilai berlabel. */
  const nik = provinsi && tanggal ? nikTerkoreksi(teks, provinsi, tanggal) : (POLA_NIK.exec(teks)?.[1] ?? nikBerlabel(teks))
  const nama = nilaiSetelah(teks, 'Nama').toUpperCase()
  return { nik, nama, yakin: Boolean(nik) && Boolean(nama) }
}
