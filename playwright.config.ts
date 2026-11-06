import { defineConfig } from '@playwright/test'

/* Uji mengarah ke aplikasi yang sudah berjalan: produksi secara bawaan,
   atau dev server lokal lewat BASE_URL. Tidak ada webServer otomatis. */
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://103.157.26.40.sslip.io:8555',
    viewport: { width: 1440, height: 1000 },
  },
})
