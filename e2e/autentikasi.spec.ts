import { expect, test, type Page } from '@playwright/test'
import { bukti, masukSebagai } from './bantuan'

const AKAR_NASKAH = '../capstone_project_6'

/* OCR tesseract butuh beberapa detik; hasilnya menutup pesan "Membaca…" dengan
   pesan sukses atau galat. Keduanya diterima — penentu lulusnya kasus adalah
   isian NIK/nama, sesuai catatan putaran 30 Oktober. */
async function tungguOcr(page: Page): Promise<void> {
  await page.getByText(/Data KTP terbaca|KTP tidak terbaca/).waitFor({ timeout: 60_000 })
}

test('BB-01 masuk pemilik', async ({ page }) => {
  await masukSebagai(page, 'wahyu@umkm.id')
  await expect(page).toHaveURL(/\/pemilik$/)
  await expect(page.getByRole('banner').getByText('Wahyu Pratama')).toBeVisible()
  await page.screenshot({ path: bukti('bb-01-masuk-pemilik') })
})

test('BB-02 masuk penyewa', async ({ page }) => {
  await masukSebagai(page, 'bima@umkm.id')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('html[data-role="renter"]')).toHaveCount(1)
  await page.screenshot({ path: bukti('bb-02-masuk-penyewa') })
})

test('BB-03 batas peran', async ({ page }) => {
  await masukSebagai(page, 'bima@umkm.id')
  await page.goto('/pemilik')
  await expect(page).toHaveURL(/\/403$/)
  await page.screenshot({ path: bukti('bb-03-batas-peran') })
})

test('BB-17 OCR ktp1', async ({ page }) => {
  await page.goto('/daftar')
  await page.locator('#ktp').setInputFiles(`${AKAR_NASKAH}/assets/ktp/ktp1.jpeg`)
  await tungguOcr(page)
  await expect(page.locator('#nik')).toHaveValue('7312042510720002')
  await expect(page.locator('#name')).toHaveValue('ABBURRAUF SPD MPD')
  await page.screenshot({ path: bukti('bb-17-ocr-ktp1') })
})

test('BB-18 OCR ktp2', async ({ page }) => {
  await page.goto('/daftar')
  await page.locator('#ktp').setInputFiles(`${AKAR_NASKAH}/assets/ktp/ktp2.jpeg`)
  await tungguOcr(page)
  /* NIK boleh tidak terbaca (catatan putaran 30 Okt); nama wajib terisi.
     Bila NIK kosong, isi manual seperti yang diharapkan dari pengguna. */
  await expect(page.locator('#name')).toHaveValue('MIRA SETIAWAN')
  if ((await page.locator('#nik').inputValue()) === '') {
    await page.locator('#nik').fill('3175036109930002')
  }
  await page.screenshot({ path: bukti('bb-18-ocr-ktp2') })
})
