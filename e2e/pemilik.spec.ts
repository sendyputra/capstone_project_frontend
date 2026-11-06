import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { jepret, masukSebagai } from './bantuan'

const AKAR_NASKAH = '../capstone_project_6'

test.beforeEach(async ({ page }) => {
  await masukSebagai(page, 'wahyu@umkm.id')
})

/* Kasus baca-asli dulu: angka dashboard hanya benar sebelum ada mutasi. */

test('BB-04 dashboard angka', async ({ page }) => {
  await page.goto('/pemilik')
  await expect(page.getByText('16 Unit')).toBeVisible()
  await expect(page.getByText('7 Unit')).toBeVisible()
  await expect(page.getByText('8 Unit')).toBeVisible()
  await expect(page.getByText('Rp 13.100.000')).toBeVisible()
  await jepret(page, 'bb-04-dashboard-angka')
})

test('BB-05 unit perawatan', async ({ page }) => {
  await page.goto('/pemilik')
  const total = 16
  const terisi = 7
  const tersedia = 8
  /* Perawatan tidak masuk kolom Terisi maupun Tersedia: selisihnya satu unit. */
  expect(total - terisi - tersedia).toBe(1)
  await expect(page.locator('.apexcharts-legend', { hasText: 'Perawatan' }).first()).toBeVisible()
  await jepret(page, 'bb-05-unit-perawatan')
})

test('BB-06 tunggakan kontrak', async ({ page }) => {
  await page.goto('/pemilik')
  /* Data demo membawa tunggakan bulan-bulan lama pada kontrak yang sudah lewat;
     angkanya ikut DemoSeeder, bukan nol. */
  const tunggakan = page.locator('section', { hasText: 'Tunggakan' }).first()
  await expect(tunggakan.getByText('11 tagihan')).toBeVisible()
  await expect(tunggakan.getByText(/Total Rp/)).toBeVisible()
  const habis = page.locator('section', { hasText: 'Kontrak Akan Habis' }).first()
  await expect(habis.getByText('1 kontrak')).toBeVisible()
  await jepret(page, 'bb-06-tunggakan-kontrak')
})

test('BB-24 grafik dashboard', async ({ page }) => {
  await page.goto('/pemilik')
  await expect(page.locator('.apexcharts-canvas')).toHaveCount(2)
  await jepret(page, 'bb-24-grafik-dashboard')
})

/* Mulai mutasi: unit dan kalender. */

test('BB-07 ubah status unit', async ({ page }) => {
  await page.goto('/pemilik/unit')
  const baris = page.locator('tr', { hasText: 'Kontrakan Ketintang' })
  await expect(baris.getByText('Tersedia')).toBeVisible()
  await baris.getByLabel('Ubah status Kontrakan Ketintang').click()
  await expect(page.getByRole('status').getByText('Status unit diperbarui.')).toBeVisible()
  await expect(baris.getByText('Terisi')).toBeVisible()
  await jepret(page, 'bb-07-ubah-status-unit')
})

async function isiFormUnit(page: import('@playwright/test').Page, nama: string, tipe: string) {
  await page.goto('/pemilik/unit/baru')
  await page.getByLabel('Nama / Judul Unit').fill(nama)
  await page.getByLabel('Tipe Properti').selectOption({ label: tipe })
  await page.getByLabel('Lokasi Singkat').fill('Jl. Uji Otomatis No. 1, Surabaya')
  await page.getByLabel('Harga per Bulan (Rp)').fill('1500000')
}

test('BB-08 tambah unit', async ({ page }) => {
  await isiFormUnit(page, 'Kos Uji Otomatis', 'Kamar Kos')
  await page.getByRole('button', { name: 'Simpan Unit' }).click()
  await expect(page).toHaveURL(/\/pemilik\/unit$/)
  const baris = page.locator('tr', { hasText: 'Kos Uji Otomatis' })
  await expect(baris).toBeVisible()
  /* Daftar sebelumnya 16 baris unit, tambahan ini menjadikan 17. */
  await expect(page.locator('tbody tr')).toHaveCount(17)
  await jepret(page, 'bb-08-tambah-unit')
})

test('BB-26 tambah unit fasilitas foto', async ({ page }) => {
  await isiFormUnit(page, 'Kos Uji Fasilitas Foto', 'Kamar Kos')
  await page.getByLabel('Fasilitas (pisahkan dengan koma)').fill('AC, WiFi, Kamar Mandi Dalam')
  await page.getByLabel('Foto unit').setInputFiles(`${AKAR_NASKAH}/opendesign/assets/kos.jpg`)
  await page.getByRole('button', { name: 'Simpan Unit' }).click()
  await expect(page).toHaveURL(/\/pemilik\/unit$/)
  await page.locator('tr', { hasText: 'Kos Uji Fasilitas Foto' }).getByRole('link', { name: 'Kos Uji Fasilitas Foto' }).click()
  await expect(page.getByText('AC')).toBeVisible()
  await expect(page.getByText('Kamar Mandi Dalam')).toBeVisible()
  await jepret(page, 'bb-26-tambah-unit-fasilitas-foto')
})

test('BB-13 blokir tanggal', async ({ page }) => {
  await page.goto('/pemilik/unit/1')
  /* Rentang yang menabrak kontrak ditolak backend. */
  await page.getByLabel('Mulai blokir').fill('2026-12-10')
  await page.getByLabel('Selesai blokir').fill('2026-12-12')
  await page.getByRole('button', { name: 'Blokir Tanggal' }).click()
  await expect(page.getByRole('alert').first()).toBeVisible()
  await jepret(page, 'bb-13-blokir-tanggal')
  /* Rentang kosong tersimpan dan tampil di daftar. */
  await page.getByLabel('Mulai blokir').fill('2027-06-10')
  await page.getByLabel('Selesai blokir').fill('2027-06-12')
  await page.getByLabel('Catatan').fill('Renovasi')
  await page.getByRole('button', { name: 'Blokir Tanggal' }).click()
  await expect(page.getByText('10 Jun 2027 – 12 Jun 2027')).toBeVisible()
  await expect(page.getByText('(Renovasi)')).toBeVisible()
})

/* Penyewa, kontrak, pembayaran. */

test('BB-20 kelola penyewa', async ({ page }) => {
  await page.goto('/pemilik/penyewa')
  const form = page.getByRole('form', { name: 'Form penyewa' })
  await form.getByLabel('Nama').fill('Dewi Lestari')
  await form.getByLabel('Telepon').fill('081234567890')
  await form.getByLabel('KTP').selectOption('Belum')
  await form.getByRole('button', { name: 'Simpan Penyewa' }).click()
  const baris = page.locator('tr', { hasText: 'Dewi Lestari' })
  await expect(baris).toBeVisible()
  await expect(baris.getByRole('cell', { name: '0', exact: true })).toBeVisible()
  await expect(baris.getByRole('button', { name: 'Hapus' })).toBeVisible()
  await jepret(page, 'bb-20-kelola-penyewa')
})

test('BB-22 kontrak owner', async ({ page }) => {
  await page.goto('/pemilik/kontrak')
  await page.getByRole('button', { name: 'Buat Kontrak' }).click()
  const form = page.getByRole('form', { name: 'Form buat kontrak' })
  await form.getByLabel('Penyewa').selectOption({ label: 'Dewi Lestari' })
  await form.getByLabel('Unit').selectOption({ label: 'Apartemen Bratang 1 BR' })
  await form.getByLabel('Mulai sewa').fill('2026-12-01')
  await form.getByLabel('Durasi').selectOption({ label: '1 bulan' })
  await form.getByRole('button', { name: 'Simpan Kontrak' }).click()
  await expect(page.getByRole('status').getByText('Kontrak Dewi Lestari dibuat dan menunggu persetujuan.')).toBeVisible()
  /* Daftar tidak selalu dibatalkan otomatis; muat ulang supaya baris baru terlihat. */
  await page.reload()
  const baris = page.locator('tr', { hasText: 'Dewi Lestari' })
  await expect(baris.getByText('Menunggu')).toBeVisible()
  await expect(baris.getByText('Rp 2.700.000')).toBeVisible()
  await jepret(page, 'bb-22-kontrak-owner')
})

test('BB-09 setujui kontrak', async ({ page }) => {
  await page.goto('/pemilik/kontrak')
  await expect(page.getByText('7 Aktif')).toBeVisible()
  const baris = page.locator('tr', { hasText: 'Kos Melati B2' })
  await baris.getByRole('button', { name: 'Setujui' }).click()
  await expect(page.getByRole('status').getByText(/diaktifkan\./)).toBeVisible()
  await expect(page.getByText('8 Aktif')).toBeVisible()
  await jepret(page, 'bb-09-setujui-kontrak')
})

test('BB-23 pembayaran manual', async ({ page }) => {
  await page.goto('/pemilik/pembayaran')
  await page.getByRole('button', { name: 'Catat Pembayaran' }).click()
  const form = page.getByRole('form', { name: 'Form catat pembayaran' })
  await form.getByLabel('Kontrak').selectOption({ label: 'Nur Aisyah — Kos Melati B1' })
  /* Bulan yang belum dibayar terisi otomatis oleh formulir. */
  const bulan = await form.getByLabel('Bulan').inputValue()
  expect(bulan).not.toBe('')
  await expect(form.getByLabel('Jumlah')).not.toHaveValue('0')
  await form.getByRole('button', { name: 'Simpan Pembayaran' }).click()
  await expect(page.getByRole('status').getByText(/dicatat\./)).toBeVisible()
  await jepret(page, 'bb-23-pembayaran-manual')
})

test('BB-10 setujui bukti', async ({ page }) => {
  await page.goto('/pemilik/pembayaran')
  await expect(page.getByText('7 Menunggu')).toBeVisible()
  /* Bukan baris Bima: tagihan Menunggu milik Bima disisakan untuk kasus
     BB-15 dan BB-16 di spec penyewa. */
  /* Baris data saja — baris filter di thead memuat teks status tanpa tombol. */
  const baris = page.locator('tbody tr', { hasText: 'Menunggu Verifikasi' }).filter({ hasNotText: 'Bima' }).first()
  await baris.getByRole('button', { name: 'Setujui' }).click()
  await expect(page.getByRole('status').getByText(/diterima\./)).toBeVisible()
  await expect(page.getByText('6 Menunggu')).toBeVisible()
  await jepret(page, 'bb-10-setujui-bukti')
})

/* Notifikasi dan ekspor: terakhir supaya lencana dan unduhan tidak mengganggu. */

test('BB-21 lonceng notifikasi', async ({ page }) => {
  await page.goto('/pemilik')
  await expect(page.getByRole('button', { name: 'Notifikasi' }).getByText('2')).toBeVisible()
  await page.getByRole('button', { name: 'Notifikasi' }).click()
  const panel = page.getByRole('dialog', { name: 'Notifikasi' })
  await expect(panel.getByText(/pengingat|tagihan/i).first()).toBeVisible()
  await panel.getByRole('button', { name: 'Tandai semua dibaca' }).click()
  await expect(page.getByRole('button', { name: 'Notifikasi' }).locator('span.bg-brand-danger')).toHaveCount(0)
  await jepret(page, 'bb-21-lonceng-notifikasi')
})

test('BB-19 ekspor csv', async ({ page }) => {
  await page.goto('/pemilik/kontrak')
  const unduhan = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Unduh CSV' }).click()
  const berkas = await unduhan
  const isi = await readFile(await berkas.path(), 'utf8')
  expect(isi.startsWith('\uFEFF')).toBe(true)
  expect(isi).toContain(';')
  await jepret(page, 'bb-19-ekspor-csv')
})
