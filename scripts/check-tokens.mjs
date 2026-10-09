import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoIni = dirname(dirname(fileURLToPath(import.meta.url)))
const indexCss = readFileSync(join(repoIni, 'src', 'styles', 'index.css'), 'utf8')

/* Kelas yang dipakai purwarupa dan harus punya pemetaan di blok `@theme`.
   Kiri variabel tema, kanan utilitas yang mengharapkannya. Purwarupa menunjuk
   beberapa token lewat perantara (…-tint -> --nb-*-100, …-sunken-hover ->
   --border); perantaranya ada, jadi dipetakan apa adanya. */
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
  ['--color-brand-warning', 'border-l-brand-warning'],
  ['--color-brand-info', 'text-brand-info'],
  ['--color-brand-danger-hover', 'hover:bg-brand-danger-hover'],
  ['--color-brand-scrim', 'bg-brand-scrim'],
  ['--color-brand-text-inverse', 'text-brand-text-inverse'],

  /* Paritas dengan tokens.tailwind.js purwarupa: setiap kunci yang ia petakan
     juga harus punya padanannya di sini, supaya kedua proyeksi tidak menyimpang. */
  ['--color-brand-blue-300', 'text-brand-blue-300'],
  ['--color-brand-blue-400', 'text-brand-blue-400'],
  ['--color-brand-blue-500', 'text-brand-blue-500'],
  ['--color-brand-blue-950', 'bg-brand-blue-950'],
  ['--color-brand-teal-600', 'bg-brand-teal-600'],
  ['--color-brand-teal-950', 'bg-brand-teal-950'],
  ['--color-brand-neutral-400', 'text-brand-neutral-400'],
  ['--color-brand-neutral-500', 'text-brand-neutral-500'],
  ['--color-brand-surface-sunken-hover', 'hover:bg-brand-surface-sunken-hover'],
  ['--color-brand-success-400', 'text-brand-success-400'],
  ['--color-brand-success-700', 'text-brand-success-700'],
  ['--color-brand-success-800', 'text-brand-success-800'],
  ['--color-brand-success-tint', 'bg-brand-success-tint'],
  ['--color-brand-danger-tint', 'bg-brand-danger-tint'],
  ['--radius-xs', 'rounded-xs'],
  ['--duration-base', 'duration-base'],
  ['--duration-slow', 'duration-slow'],
  ['--ease-out', 'ease-out'],
  ['--ease-in', 'ease-in'],
  ['--ease-inout', 'ease-inout'],
]

const hilang = wajib.filter(([token]) => !new RegExp('^\\s*' + token + ':', 'm').test(indexCss))

if (hilang.length) {
  console.error('Pemetaan token kurang di src/styles/index.css (@theme):')
  hilang.forEach(([token, kelas]) => console.error(`  ${token}  ->  ${kelas}`))
  process.exit(1)
}

console.log(`check:tokens lolos: ${wajib.length} pemetaan token ada`)
