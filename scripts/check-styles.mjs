import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoIni = dirname(dirname(fileURLToPath(import.meta.url)))
const akar = join(repoIni, 'src')
const terlarang = /(?:^|[\s"':])(?:bg|text|border|ring|from|via|to|fill|stroke|shadow|outline|divide|placeholder|decoration)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d+)?/
const pengecualian = /brand-/

const pelanggaran = []

function telusuri(direktori) {
  for (const nama of readdirSync(direktori)) {
    const jalur = join(direktori, nama)
    if (statSync(jalur).isDirectory()) { telusuri(jalur); continue }
    if (!/\.(tsx?|css)$/.test(nama)) continue
    /* tokens.css adalah salinan kanonik dari repo naskah — ia memuat catatan
       berisi nama kelas contoh, bukan pemakaian. Hanya aplikasi yang diperiksa. */
    if (relative(akar, jalur) === join('styles', 'tokens.css')) continue
    const baris = readFileSync(jalur, 'utf8').split('\n')
    baris.forEach((isi, indeks) => {
      if (pengecualian.test(isi)) return
      if (terlarang.test(isi)) {
        pelanggaran.push(`${relative(repoIni, jalur)}:${indeks + 1}: ${isi.trim()}`)
      }
    })
  }
}

telusuri(akar)

if (pelanggaran.length) {
  console.error('Kelas warna mentah ditemukan — pakai token:')
  pelanggaran.forEach((baris) => console.error('  ' + baris))
  process.exit(1)
}
console.log('check:styles lolos: tidak ada kelas warna mentah')
