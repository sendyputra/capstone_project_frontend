import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Page } from '@playwright/test'

/* ponytail: path tetangga diketik langsung sesuai tata letak workspace
   (repo naskah di ../capstone_project_6); naik kelas jadi env/arg bila
   tata letak berubah. */
const AKAR_NASKAH = resolve(import.meta.dirname, '../../capstone_project_6')

function direktoriBukti(): string {
  const tanggal = new Date().toISOString().slice(0, 10)
  const dir = process.env.BUKTI_DIR ?? resolve(AKAR_NASKAH, 'docs', `bukti-blackbox-${tanggal}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

export function bukti(nama: string): string {
  return resolve(direktoriBukti(), `${nama}.png`)
}

export const SANDI_DEMO = 'demo12345'

export type AkunUji = 'wahyu@umkm.id' | 'bima@umkm.id'

export async function masukSebagai(page: Page, email: AkunUji): Promise<void> {
  await page.goto('/masuk')
  await page.getByLabel('Email / Nomor WhatsApp').fill(email)
  await page.getByLabel('Kata sandi').fill(SANDI_DEMO)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await page.waitForURL((url) => url.pathname !== '/masuk')
}
