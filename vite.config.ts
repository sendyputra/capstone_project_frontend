import { rmSync } from 'node:fs'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

/* Worker MSW hanya dipakai saat pengembangan lokal. Build live dan preview
   selalu memakai API asli, jadi berkasnya tidak boleh ikut terunggah. */
const buangMockWorker: Plugin = {
  name: 'buang-mock-worker',
  apply: 'build',
  closeBundle() {
    rmSync(new URL('./dist/mockServiceWorker.js', import.meta.url), { force: true })
  },
}

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss(), buangMockWorker],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
