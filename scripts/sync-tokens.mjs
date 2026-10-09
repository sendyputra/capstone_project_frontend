import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoIni = dirname(dirname(fileURLToPath(import.meta.url)))
const naskah = process.env.CAPSTONE_NASKAH ?? join(repoIni, '..', 'capstone_project_6')
const sumber = join(naskah, 'opendesign')
const tujuan = join(repoIni, 'src', 'styles')
const tujuanPublik = join(repoIni, 'public', 'demo')

/* Gambar data contoh ikut dari naskah supaya repo ini tidak menautkan berkas
   luar: satu sumber, sama seperti token dan font. */
const berkas = [
  ['tokens.css', join(tujuan, 'tokens.css')],
  [join('assets', 'plus-jakarta-sans-latin.woff2'), join(tujuan, 'assets', 'plus-jakarta-sans-latin.woff2')],
  [join('assets', 'kos.jpg'), join(tujuanPublik, 'kos.jpg')],
  [join('assets', 'kontrakan.jpg'), join(tujuanPublik, 'kontrakan.jpg')],
  [join('assets', 'ruko.jpg'), join(tujuanPublik, 'ruko.jpg')],
  [join('assets', 'logo.jpg'), join(tujuanPublik, 'logo.jpg')],
]

mkdirSync(join(tujuan, 'assets'), { recursive: true })
mkdirSync(tujuanPublik, { recursive: true })

let gagal = false
for (const [dari, ke] of berkas) {
  const isiSumber = readFileSync(join(sumber, dari))
  copyFileSync(join(sumber, dari), ke)
  const isiTujuan = readFileSync(ke)
  if (!isiSumber.equals(isiTujuan)) {
    console.error(`SALINAN BERBEDA: ${ke}`)
    gagal = true
  }
  console.log(`disalin: ${dari} -> ${ke.replace(repoIni + '/', '')}`)
}
process.exit(gagal ? 1 : 0)
