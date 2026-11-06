import { expect, test } from '@playwright/test'
import { bukti, jepret, masukSebagai } from './bantuan'

const AKAR_NASKAH = '../capstone_project_6'

test.beforeEach(async ({ page }) => {
  await masukSebagai(page, 'bima@umkm.id')
})

test('BB-11 katalog', async ({ page }) => {
  await page.goto('/katalog')
  /* Tunggu kartu pertama; badge terender sejak awal dengan angka 0. */
  const kartu = page.getByRole('link', { name: 'Detail Unit' })
  await expect(kartu.first()).toBeVisible()
  const badge = page.getByText(/Unit Ditemukan/)
  const angka = Number((await badge.innerText()).match(/\d+/)?.[0] ?? 0)
  expect(angka).toBeGreaterThan(0)
  /* Setiap unit ditemukan punya kartu; angka badge dan jumlah kartu sama. */
  await expect(kartu).toHaveCount(angka)
  await jepret(page, 'bb-11-katalog')
})

test('BB-12 cari ruko', async ({ page }) => {
  await page.goto('/katalog')
  await page.getByPlaceholder('Ketik nama unit atau lokasi (misal: Bandung, Kos)...').fill('ruko')
  const kartu = page.locator('main article')
  await expect(kartu.first()).toBeVisible()
  const jumlah = await kartu.count()
  expect(jumlah).toBeGreaterThan(0)
  for (let i = 0; i < jumlah; i += 1) {
    await expect(kartu.nth(i)).toContainText(/ruko/i)
  }
  await jepret(page, 'bb-12-cari-ruko')
})

test('BB-14 pengajuan sewa', async ({ page }) => {
  await page.goto('/katalog')
  await page.locator('main article', { hasText: 'Kontrakan Rungkut' }).getByRole('link', { name: 'Detail Unit' }).click()
  await expect(page.getByRole('heading', { name: 'Kontrakan Rungkut' })).toBeVisible()
  /* 9–16 Nov 2026 diblokir pada data demo; pilih rentang di luarnya. */
  await page.getByLabel('Mulai sewa').fill('2026-11-20')
  await page.getByLabel('Durasi').selectOption({ label: '1 bulan' })
  await page.getByRole('button', { name: 'Ajukan Sewa' }).click()
  await expect(page.getByRole('status').getByText('Pengajuan sewa terkirim dan masuk daftar pengajuan pemilik.')).toBeVisible()
  await jepret(page, 'bb-14-pengajuan-sewa')
})

test('BB-15 tagihan penyewa', async ({ page }) => {
  await page.goto('/tagihan')
  await page.getByRole('tab', { name: /Sewa Berjalan/ }).click()
  const baris = page.locator('tr', { hasText: 'Kos Melati A1' })
  await expect(baris.filter({ hasText: 'Oktober' }).getByText('Lunas')).toBeVisible()
  await expect(baris.filter({ hasText: 'November' }).getByText('Menunggu Verifikasi')).toBeVisible()
  await jepret(page, 'bb-15-tagihan-penyewa')
})

test('BB-16 unggah ulang bukti', async ({ browser, page }) => {
  /* Sesi ada di localStorage, jadi pemilik dan penyewa harus konteks berbeda. */
  const ctxPemilik = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const pemilik = await ctxPemilik.newPage()
  await masukSebagai(pemilik, 'wahyu@umkm.id')
  await pemilik.goto('/pemilik/pembayaran')
  const barisPemilik = pemilik.locator('tr', { hasText: 'Kos Melati A1' }).filter({ hasText: 'Menunggu Verifikasi' }).first()
  await barisPemilik.getByRole('button', { name: 'Tolak' }).click()
  await pemilik.getByRole('button', { name: 'Tolak bukti' }).click()
  await expect(pemilik.getByRole('status').getByText('Bukti bayar ditolak. Penyewa diminta mengunggah ulang.')).toBeVisible()
  await ctxPemilik.close()

  /* Penyewa melihat status Ditolak, lalu mengunggah ulang buktinya. */
  await page.goto('/tagihan')
  await page.getByRole('tab', { name: /Sewa Berjalan/ }).click()
  const baris = page.locator('tr', { hasText: 'Kos Melati A1' }).filter({ hasText: 'November' })
  await expect(baris.getByText('Ditolak')).toBeVisible()
  await baris.locator('input[type="file"]').setInputFiles(`${AKAR_NASKAH}/assets/ktp/ktp1.jpeg`)
  await expect(page.getByRole('status').getByText('Bukti bayar terkirim dan menunggu verifikasi pemilik.')).toBeVisible()
  await jepret(page, 'bb-16-unggah-ulang-bukti')
})

test('BB-25 kontrak berakhir tanggal', async ({ browser, page }) => {
  /* Kontrak lama Kos Melati A1 berakhir 2027-02-01; tanggal akhir bukan hari
     terisi, jadi sewa baru boleh mulai tepat pada tanggal itu. Unitnya sedang
     terisi, jadi detailnya dibuka langsung lewat rutenya, bukan dari katalog. */
  await page.goto('/katalog/1')
  await page.getByLabel('Mulai sewa').fill('2027-02-01')
  await page.getByLabel('Durasi').selectOption({ label: '1 bulan' })
  await page.getByRole('button', { name: 'Ajukan Sewa' }).click()
  await expect(page.getByRole('status').getByText('Pengajuan sewa terkirim dan masuk daftar pengajuan pemilik.')).toBeVisible()
  await jepret(page, 'bb-25-kontrak-berakhir-tanggal')

  /* Sesi pemilik melihat kontrak baru itu berstatus Menunggu. */
  const ctxPemilik = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const pemilik = await ctxPemilik.newPage()
  await masukSebagai(pemilik, 'wahyu@umkm.id')
  await pemilik.goto('/pemilik/kontrak')
  const baris = pemilik.locator('tr', { hasText: 'Kos Melati A1' }).filter({ hasText: 'Bima' }).first()
  await expect(baris.getByText('Menunggu')).toBeVisible()
  await pemilik.screenshot({ path: bukti('bb-25-kontrak-diterima'), fullPage: true })
  await ctxPemilik.close()
})
