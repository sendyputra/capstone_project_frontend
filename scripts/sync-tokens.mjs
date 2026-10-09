import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoIni = dirname(dirname(fileURLToPath(import.meta.url)))
const naskah = process.env.CAPSTONE_NASKAH ?? join(repoIni, '..', 'capstone_project_6')
const sumber = join(naskah, 'opendesign')
const tujuan = join(repoIni, 'src', 'styles')

const berkas = [
  ['tokens.css', join(tujuan, 'tokens.css')],
  [join('assets', 'plus-jakarta-sans-latin.woff2'), join(tujuan, 'assets', 'plus-jakarta-sans-latin.woff2')],
]

mkdirSync(join(tujuan, 'assets'), { recursive: true })

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
