import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoIni = dirname(dirname(fileURLToPath(import.meta.url)))
const indexCss = readFileSync(join(repoIni, 'src', 'styles', 'index.css'), 'utf8')

/* Kelas yang dipakai purwarupa dan harus punya pemetaan di blok `@theme`.
   Kiri variabel tema, kanan utilitas yang mengharapkannya. Purwarupa menunjuk
   beberapa token yang memang tidak ada di tokens.css (…-tint, …-sunken-hover);
   yang tidak ada sengaja tidak didaftarkan di sini. */
const wajib = [
  ['--background-image-hero', 'bg-hero'],
  ['--background-image-panel', 'bg-panel'],
  ['--color-brand-teal-100', 'text-brand-teal-100'],
  ['--color-brand-teal-300', 'text-brand-teal-300'],
  ['--color-brand-teal-500', 'border-brand-teal-500'],
  ['--color-brand-teal-900', 'bg-brand-teal-900'],
  ['--color-brand-neutral-200', 'text-brand-neutral-200'],
  ['--color-brand-neutral-700', 'bg-brand-neutral-700'],
  ['--color-brand-neutral-900', 'bg-brand-neutral-900'],
  ['--color-brand-instagram', 'bg-brand-instagram'],
  ['--color-brand-whatsapp', 'bg-brand-whatsapp'],
  ['--color-brand-success-hover', 'hover:bg-brand-success-hover'],
  ['--color-brand-danger-hover', 'hover:bg-brand-danger-hover'],
  ['--color-brand-scrim', 'bg-brand-scrim'],
  ['--color-brand-text-inverse', 'text-brand-text-inverse'],
]

const hilang = wajib.filter(([token]) => !new RegExp('^\\s*' + token + ':', 'm').test(indexCss))

if (hilang.length) {
  console.error('Pemetaan token kurang di src/styles/index.css (@theme):')
  hilang.forEach(([token, kelas]) => console.error(`  ${token}  ->  ${kelas}`))
  process.exit(1)
}

console.log(`check:tokens lolos: ${wajib.length} pemetaan token ada`)
