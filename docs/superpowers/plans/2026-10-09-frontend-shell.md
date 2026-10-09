# Rencana Implementasi — Kerangka Frontend dan Potongan Pertama

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun kerangka aplikasi React (routing per peran, klien HTTP, batas mock MSW, pipa token desain) plus satu alur utuh yang jalan dan teruji: masuk → kelola unit pemilik.

**Architecture:** React Router berperan sebagai data router dengan penjaga peran yang membaca sesi dari satu modul penyimpanan. Semua akses data lewat hook TanStack Query; komponen tidak pernah memanggil `fetch`. Di mode mock, MSW menangkap permintaan di level jaringan sehingga kode fitur identik dengan mode API asli. Gaya berasal dari token `opendesign/tokens.css` yang diproyeksikan ke Tailwind v4 lewat `@theme inline`, dengan komponen shadcn di-*theme* ke token yang sama.

**Tech Stack:** Vite 8, React 19 + TypeScript, Tailwind v4 (`@tailwindcss/vite`), shadcn, React Router 7, TanStack Query 5, MSW 2, react-hook-form + zod, Vitest + React Testing Library + jsdom, oxlint, bun.

**Spec:** `docs/superpowers/specs/2026-10-09-frontend-shell-design.md`

## Global Constraints

- Nama berkas `kebab-case`, komponen `PascalCase`; hook query dan mutasi tinggal di `features/<fitur>/api.ts`, hook berdiri sendiri di `use-*.ts`.
- Tidak ada kelas warna mentah (`bg-red-500`, `text-slate-700`, dan sejenisnya) di `src/`. Semua warna lewat token.
- Teks antarmuka berbahasa Indonesia memakai kosakata ranah terkunci: Kos, Kontrakan, Ruang Usaha, Apartemen, Tersedia, Terisi, Siap Huni, Penyewa, Pemilik, Pengajuan Sewa.
- Nilai uang dikirim sebagai angka rupiah utuh dan diformat di layar; desimal `"1200000.00"` dari backend dinormalisasi di `lib/format.ts`.
- Peran API `penyewa|pemilik|admin` dipetakan ke atribut `data-role` bernilai `renter|owner|admin` — hanya nilai `renter` dan `owner` yang punya blok aksen di `tokens.css`.
- Ukuran uang: `decimal(15,2)`. Bulan tagihan: `YYYY-MM`.
- Perintah: `bun run dev`, `build` (tsc + vite), `lint` (oxlint), `typecheck`, `test`, `test:watch`, `tokens:sync`, `check:styles`.
- Commit bahasa Indonesia bentuk `tipe(lingkup): ringkasan`, langsung di `main`.
- Tes memakai handler MSW yang sama dengan pengembangan, dan menguji kelas gaya (bukan warna hasil hitung, karena CSS tidak dibangun di jsdom).

## Review Focus

Lima hal yang tidak diuji oleh test turunan spec mana pun, dan paling mungkin menggigit pemakai aplikasi ini. Tiap baris mendapat tesnya di task yang memiliki kodenya.

1. **Sesi kedaluwarsa saat aplikasi sudah terbuka** — pengguna menekan simpan, server menjawab 401 di tengah jalan; yang wajar: sesi dibuang dan pengguna diantar kembali ke layar masuk dengan pesan, bukan layar kosong atau galat mentah. (Task 4)
2. **Harga dari backend datang sebagai string desimal** (`"1200000.00"`) karena kolomnya `decimal(15,2)`; yang wajar: ditampilkan `Rp 1.200.000`, bukan `Rp 1.200.000,00` maupun `NaN`. (Task 3)
3. **Sesi rusak di `localStorage`** (JSON tidak sah atau bidang hilang) akibat versi lama atau sunting manual; yang wajar: diperlakukan sebagai belum masuk, aplikasi tidak layar putih. (Task 4)
4. **Unit milik pemilik lain** ikut muncul di daftar karena backend mengirim lebih banyak dari yang seharusnya; yang wajar: peran pemilik hanya melihat unitnya sendiri. (Task 7)
5. **Tombol simpan ditekan dua kali cepat** — yang wajar: satu unit terbuat, tombol kedua tidak berpengaruh selama permintaan pertama berjalan. (Task 9)

---

### Task 1: Pipa token dan pagar gaya

**Files:**
- Create: `scripts/sync-tokens.mjs`, `scripts/check-styles.mjs`, `src/styles/index.css`, `src/styles/assets/plus-jakarta-sans-latin.woff2` (hasil salinan), `src/styles/tokens.css` (hasil salinan)
- Modify: `package.json`, `vite.config.ts`, `tsconfig.app.json`, `src/main.tsx`

**Interfaces:**
- Consumes: `opendesign/tokens.css` dan `opendesign/assets/plus-jakarta-sans-latin.woff2` dari repo naskah.
- Produces: kelas utilitas berbasis token (`bg-brand-surface`, `text-brand-text-muted`, `bg-brand-accent`, `rounded-lg`, `shadow-sm`, `max-w-container`, `h-appbar`, `duration-base`), perintah `bun run tokens:sync` dan `bun run check:styles`.

- [ ] **Step 1: Pasang Tailwind dan alias jalur**

```bash
bun add -d tailwindcss @tailwindcss/vite
```

`tsconfig.app.json` — tambahkan `baseUrl` dan `paths` di dalam `compilerOptions`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

`vite.config.ts`:

```ts
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
```

- [ ] **Step 2: Tulis skrip penyelaras token**

`scripts/sync-tokens.mjs`:

```js
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
```

Catatan: karena salinannya harus identik dengan berkas kanonik, `src/styles/tokens.css` **tidak** diberi komentar kepala — komentar apa pun akan menggagalkan pemeriksaan identik. Penanda "berkas turunan" ditaruh di `src/styles/index.css` yang memuatnya, dan di README pada Task 11.

- [ ] **Step 3: Tulis berkas gaya utama**

`src/styles/index.css`:

```css
/* Bahasa visual berasal dari repo naskah. tokens.css adalah salinan turunan;
   sunting berkas kanoniknya di opendesign/ lalu jalankan `bun run tokens:sync`.
   Berkas ini yang memetakan token ke kelas utilitas Tailwind dan ke nama
   variabel yang diharapkan komponen shadcn. */
@import 'tailwindcss';
@import './tokens.css';

@theme inline {
  /* Palet bawaan Tailwind dimatikan supaya kelas warna mentah tidak bisa
     dipakai sama sekali; semua warna harus lewat token. */
  --color-*: initial;

  /* Ramps */
  --color-brand-blue-50: var(--nb-blue-50);
  --color-brand-blue-100: var(--nb-blue-100);
  --color-brand-blue-200: var(--nb-blue-200);
  --color-brand-blue-600: var(--nb-blue-600);
  --color-brand-blue-700: var(--nb-blue-700);
  --color-brand-blue-800: var(--nb-blue-800);
  --color-brand-blue-900: var(--nb-blue-900);
  --color-brand-teal-50: var(--nb-teal-50);
  --color-brand-teal-200: var(--nb-teal-200);
  --color-brand-teal-700: var(--nb-teal-700);
  --color-brand-teal-800: var(--nb-teal-800);
  --color-brand-neutral-50: var(--nb-neutral-50);
  --color-brand-neutral-100: var(--nb-neutral-100);
  --color-brand-neutral-300: var(--nb-neutral-300);
  --color-brand-neutral-600: var(--nb-neutral-600);
  --color-brand-neutral-700: var(--nb-neutral-700);
  --color-brand-neutral-800: var(--nb-neutral-800);
  --color-brand-neutral-900: var(--nb-neutral-900);
  --color-brand-neutral-950: var(--nb-neutral-950);

  /* Semantik — mengikuti tema dan peran yang aktif */
  --color-brand-bg: var(--bg);
  --color-brand-surface: var(--surface);
  --color-brand-surface-raised: var(--surface-raised);
  --color-brand-surface-sunken: var(--surface-sunken);
  --color-brand-ink: var(--surface-inverse);
  --color-brand-ink-hover: var(--surface-inverse-hover);
  --color-brand-border: var(--border);
  --color-brand-border-strong: var(--border-strong);
  --color-brand-text: var(--text);
  --color-brand-text-muted: var(--text-muted);
  --color-brand-text-subtle: var(--text-subtle);

  /* Aksen: satu peran. `data-role="owner"` menggantinya ke teal. */
  --color-brand-accent: var(--accent);
  --color-brand-accent-hover: var(--accent-hover);
  --color-brand-accent-active: var(--accent-active);
  --color-brand-accent-soft: var(--accent-soft);
  --color-brand-accent-soft-fg: var(--accent-soft-fg);
  --color-brand-accent-border: var(--accent-border);
  --color-brand-accent-track: var(--accent-track);
  --color-brand-accent-fg: var(--accent-fg);
  --color-brand-owner: var(--nb-teal-700);
  --color-brand-owner-hover: var(--accent-hover);

  /* Status */
  --color-brand-success: var(--success-solid);
  --color-brand-success-soft: var(--success-soft);
  --color-brand-success-soft-fg: var(--success-soft-fg);
  --color-brand-success-border: var(--success-border);
  --color-brand-success-fg: var(--success-fg);
  --color-brand-warning-soft: var(--warning-soft);
  --color-brand-warning-soft-fg: var(--warning-soft-fg);
  --color-brand-danger: var(--danger-solid);
  --color-brand-danger-hover: var(--danger-solid-hover);
  --color-brand-danger-soft: var(--danger-soft);
  --color-brand-danger-soft-fg: var(--danger-soft-fg);
  --color-brand-danger-border: var(--danger-border);
  --color-brand-danger-fg: var(--danger-fg);
  --color-brand-info-soft: var(--info-soft);
  --color-brand-info-soft-fg: var(--info-soft-fg);

  /* Nama yang diharapkan komponen shadcn, diarahkan ke token yang sama.
     `accent` di sini adalah permukaan hover bawaan shadcn, bukan aksen merek;
     aksen merek dipakai lewat `primary`. */
  --color-background: var(--bg);
  --color-foreground: var(--text);
  --color-card: var(--surface);
  --color-card-foreground: var(--text);
  --color-popover: var(--surface-raised);
  --color-popover-foreground: var(--text);
  --color-primary: var(--accent);
  --color-primary-foreground: var(--accent-fg);
  --color-secondary: var(--surface-sunken);
  --color-secondary-foreground: var(--text);
  --color-muted: var(--surface-sunken);
  --color-muted-foreground: var(--text-muted);
  --color-accent: var(--surface-sunken);
  --color-accent-foreground: var(--text);
  --color-destructive: var(--danger-solid);
  --color-destructive-foreground: var(--danger-fg);
  --color-border: var(--border);
  --color-input: var(--border-strong);
  --color-ring: var(--ring);

  /* Tipe, radius, elevasi, gerak, dan struktur */
  --font-sans: var(--font-body);
  --font-heading: var(--font-display);
  --font-mono: var(--font-mono);
  --text-micro: var(--text-micro);
  --text-label: var(--text-label);
  --text-ui: var(--text-ui);
  --text-body: var(--text-body);
  --text-heading-s: var(--text-heading-s);
  --text-heading-m: var(--text-heading-m);
  --text-heading-l: var(--text-heading-l);
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);
  --radius-2xl: var(--radius-2xl);
  --radius-full: var(--radius-full);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --container-container: var(--container-max);
  --spacing-appbar: var(--appbar-height);
}

@layer base {
  :root {
    --radius: var(--radius-md);
    --background: var(--bg);
    --foreground: var(--text);
    --card: var(--surface);
    --card-foreground: var(--text);
    --popover: var(--surface-raised);
    --popover-foreground: var(--text);
    --primary: var(--accent);
    --primary-foreground: var(--accent-fg);
    --secondary: var(--surface-sunken);
    --secondary-foreground: var(--text);
    --muted: var(--surface-sunken);
    --muted-foreground: var(--text-muted);
    --accent: var(--surface-sunken);
    --accent-foreground: var(--text);
    --destructive: var(--danger-solid);
    --destructive-foreground: var(--danger-fg);
    --input: var(--border-strong);
  }

  html {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--text);
  }

  :focus-visible {
    outline: var(--ring-width) solid var(--ring);
    outline-offset: var(--ring-offset);
  }
}
```

`src/main.tsx` — ganti impor gaya bawaan template:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 4: Tambahkan perintah ke package.json**

```json
{
  "scripts": {
    "tokens:sync": "node scripts/sync-tokens.mjs",
    "check:styles": "node scripts/check-styles.mjs",
    "typecheck": "tsc -b --noEmit"
  }
}
```

- [ ] **Step 5: Jalankan penyelarasan dan verifikasi utilitas token**

```bash
bun run tokens:sync
bun run build
grep -o "border-radius:var(--radius-lg)" dist/assets/*.css | head -1
grep -o "background-color:var(--surface)" dist/assets/*.css | head -1
```

Expected: `tokens:sync` menyalin dua berkas tanpa pesan `SALINAN BERBEDA`; `build` lolos; kedua `grep` menemukan kecocokan — artinya `rounded-lg` dan `bg-brand-surface` benar-benar mengarah ke token, bukan ke nilai bawaan Tailwind.

- [ ] **Step 6: Tulis pagar pemeriksa gaya**

`scripts/check-styles.mjs`:

```js
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoIni = dirname(dirname(fileURLToPath(import.meta.url)))
const akar = join(repoIni, 'src')
const terlarang = /(?:^|[\s"':])(?:bg|text|border|ring|from|via|to|fill|stroke|shadow|outline|divide|placeholder|decoration)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d+)?/
const pengecualian = /brand-/

const pelanggaran = []

function telusuri(direktori) {
  for (const nama of readdirSync(direktori)) {
    const jalur = join(direktori, nama)
    if (statSync(jalur).isDirectory()) { telusuri(jalur); continue }
    if (!/\.(tsx?|css)$/.test(nama)) continue
    const baris = readFileSync(jalur, 'utf8').split('\n')
    baris.forEach((isi, indeks) => {
      if (pengecualian.test(isi)) return
      if (terlarang.test(isi)) {
        pelanggaran.push(`${relative(repoIni, jalur)}:${indeks + 1}: ${isi.trim()}`)
      }
    })
  }
}

telusuri(akar)

if (pelanggaran.length) {
  console.error('Kelas warna mentah ditemukan — pakai token:')
  pelanggaran.forEach((baris) => console.error('  ' + baris))
  process.exit(1)
}
console.log('check:styles lolos: tidak ada kelas warna mentah')
```

- [ ] **Step 7: Buktikan pagar gaya benar-benar menangkap pelanggaran**

Sisipkan sementara `<div className="bg-red-500" />` ke `src/App.tsx`, lalu:

```bash
bun run check:styles
```

Expected: keluar dengan status 1 dan mencetak `src/App.tsx:<baris>: <div className="bg-red-500" />`. Hapus kembali sisipan itu dan jalankan lagi — Expected: `check:styles lolos`.

- [ ] **Step 8: Commit**

```bash
git add package.json bun.lock vite.config.ts tsconfig.app.json src/styles src/main.tsx scripts
git commit -m "build(gaya): pasang Tailwind v4 dengan token dari repo naskah"
```

---

### Task 2: Alat uji dan komponen dasar

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`, `src/test/render.tsx`, `src/ui/button.tsx` dan komponen shadcn lain yang disalin CLI, `src/ui/__tests__/button.test.tsx`
- Modify: `package.json`, `tsconfig.app.json` (jenis tes)

**Interfaces:**
- Consumes: alias `@/*` dan berkas gaya dari Task 1.
- Produces: `renderWithProviders(ui)` dari `@/test/render`, komponen `Button` dari `@/ui/button` dengan varian `default | secondary | destructive | ghost | outline`.

- [ ] **Step 1: Pasang alat uji dan ikon**

```bash
bun add -d vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitejs/plugin-react
bun add @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/free-brands-svg-icons @fortawesome/react-fontawesome
```

Ikon memakai Font Awesome supaya sama dengan purwarupa. Merek Instagram dan WhatsApp hanya boleh muncul di dalam chipnya sendiri, tidak sebagai permukaan atau aksen.

`tsconfig.app.json` — tambahkan `"types": ["vitest/globals", "@testing-library/jest-dom"]` pada `compilerOptions`.

- [ ] **Step 2: Konfigurasi Vitest**

`vitest.config.ts`:

```ts
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
```

`src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
})
```

`package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Siapkan pembantu render**

`src/test/render.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import { type ReactElement } from 'react'

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, options),
  }
}
```

- [ ] **Step 4: Pasang shadcn dan tarik komponen yang dipakai**

```bash
bunx --bun shadcn@latest init
```

Setelah init, arahkan `components.json` ke struktur repo ini supaya komponen mendarat di `src/ui/` dan pembantu kelasnya di `src/lib/utils.ts`:

```json
{
  "aliases": {
    "components": "@/ui",
    "ui": "@/ui",
    "utils": "@/lib/utils",
    "lib": "@/lib",
    "hooks": "@/lib"
  }
}
```

```bash
bunx --bun shadcn@latest add button input label alert-dialog
```

Setelah CLI selesai, **ganti seluruh blok `@theme` dan `:root` yang dibuat CLI di `src/styles/index.css` dengan blok dari Task 1** — CLI menambahkan palet bawaan (`oklch(...)`), dan itu melanggar aturan token. Jalankan `bun run check:styles` lalu `bun run build` untuk memastikan tidak ada kelas yang hilang.

- [ ] **Step 5: Tulis tes tombol yang gagal**

`src/ui/__tests__/button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '@/ui/button'

describe('Button', () => {
  it('memakai token aksen pada varian utama', () => {
    render(<Button>Simpan</Button>)
    expect(screen.getByRole('button', { name: 'Simpan' })).toHaveClass('bg-primary')
  })

  it('memakai permukaan bahaya pada varian merusak', () => {
    render(<Button variant="destructive">Hapus</Button>)
    expect(screen.getByRole('button', { name: 'Hapus' })).toHaveClass('bg-destructive')
  })
})
```

- [ ] **Step 6: Jalankan untuk memastikan gagal**

```bash
bun run test src/ui/__tests__/button.test.tsx
```

Expected: gagal pada kasus `destructive`. Samakan kelas varian di `src/ui/button.tsx` dengan daftar ini, dan jangan sisakan kelas warna lain:

| Varian | Kelas |
|---|---|
| `default` | `bg-primary text-primary-foreground hover:bg-brand-accent-hover` |
| `destructive` | `bg-destructive text-destructive-foreground hover:bg-brand-danger-hover` |
| `outline` | `border border-input bg-background hover:bg-accent` |
| `secondary` | `bg-secondary text-secondary-foreground hover:bg-brand-surface-sunken` |
| `ghost` | `hover:bg-accent hover:text-accent-foreground` |
| `link` | `text-primary underline-offset-4 hover:underline` |

- [ ] **Step 7: Jalankan sampai lolos**

```bash
bun run test src/ui/__tests__/button.test.tsx
bun run check:styles
bun run typecheck
```

Expected: dua tes lolos, `check:styles` lolos, `typecheck` lolos.

- [ ] **Step 8: Commit**

```bash
git add package.json bun.lock vitest.config.ts tsconfig.app.json src/test src/ui
git commit -m "test(setup): Vitest + RTL dan komponen dasar berbasis token"
```

---

### Task 3: Penyimpanan sesi, kontrak tipe, klien HTTP, dan batas mock

**Files:**
- Create: `src/features/auth/session.ts`, `src/features/auth/__tests__/session.test.ts`, `src/api/types.ts`, `src/api/client.ts`, `src/api/__tests__/client.test.ts`, `src/lib/format.ts`, `src/lib/__tests__/format.test.ts`, `src/api/mocks/data/users.ts`, `src/api/mocks/data/units.ts`, `src/api/mocks/handlers/auth.ts`, `src/api/mocks/handlers/units.ts`, `src/api/mocks/handlers/index.ts`, `src/api/mocks/server.ts`, `src/api/mocks/browser.ts`, `public/mockServiceWorker.js`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `type ApiErrorKind = 'unauthorized' | 'validation' | 'not_found' | 'conflict' | 'server' | 'network'`
  - `class ApiError extends Error { kind: ApiErrorKind; status: number; fields?: Record<string, string> }`
  - `apiFetch<T>(path: string, options?: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<T>`
  - `type User = { id: number; name: string; email: string; role: 'penyewa' | 'pemilik' | 'admin' }`
  - `type Unit = { id: number; owner_id: number; name: string; address: string; price: number; status: 'Tersedia' | 'Terisi' }`
  - `formatRupiah(value: number | string): string`, `parseAmount(value: number | string): number`
  - `server` (setupServer) untuk tes, `worker` (setupWorker) untuk peramban.

- [ ] **Step 1: Pasang MSW dan buat worker**

```bash
bun add -d msw
bunx --bun msw init public/ --save
```

- [ ] **Step 2: Tulis tes format yang gagal**

`src/lib/__tests__/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { formatRupiah, parseAmount } from '@/lib/format'

describe('parseAmount', () => {
  it('menerima angka utuh', () => {
    expect(parseAmount(1200000)).toBe(1200000)
  })

  it('menerima string desimal dari kolom decimal(15,2)', () => {
    expect(parseAmount('1200000.00')).toBe(1200000)
  })

  it('mengembalikan 0 untuk nilai yang tidak masuk akal', () => {
    expect(parseAmount('')).toBe(0)
    expect(parseAmount(null)).toBe(0)
  })
})

describe('formatRupiah', () => {
  it('memformat tanpa desimal', () => {
    expect(formatRupiah(1200000)).toBe('Rp 1.200.000')
  })

  it('memformat string desimal dari backend', () => {
    expect(formatRupiah('1200000.00')).toBe('Rp 1.200.000')
  })
})
```

- [ ] **Step 3: Jalankan untuk memastikan gagal**

```bash
bun run test src/lib/__tests__/format.test.ts
```

Expected: gagal dengan `Failed to resolve import "@/lib/format"`.

- [ ] **Step 4: Tulis implementasi format**

`src/lib/format.ts`:

```ts
export function parseAmount(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  const angka = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(',', '.'))
  return Number.isFinite(angka) ? Math.round(angka) : 0
}

export function formatRupiah(value: number | string | null | undefined): string {
  return 'Rp ' + parseAmount(value).toLocaleString('id-ID')
}

export function formatTanggal(value: string | Date): string {
  const tanggal = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(tanggal.getTime())) return '—'
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(tanggal)
}
```

- [ ] **Step 5: Jalankan sampai lolos**

```bash
bun run test src/lib/__tests__/format.test.ts
```

Expected: lima tes lolos.

- [ ] **Step 6: Tulis tipe dan klien**

`src/api/types.ts`:

```ts
export type Role = 'penyewa' | 'pemilik' | 'admin'

export type User = { id: number; name: string; email: string; role: Role }

export type UnitStatus = 'Tersedia' | 'Terisi'

export type Unit = {
  id: number
  owner_id: number
  name: string
  address: string
  price: number
  status: UnitStatus
}

export type ApiErrorKind = 'unauthorized' | 'validation' | 'not_found' | 'conflict' | 'server' | 'network'

export class ApiError extends Error {
  kind: ApiErrorKind
  status: number
  fields?: Record<string, string>

  constructor(kind: ApiErrorKind, status: number, message: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.fields = fields
  }
}
```

`src/api/client.ts`:

```ts
import { ApiError } from '@/api/types'
import { readSession } from '@/features/auth/session'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const pesanUmum: Record<string, string> = {
  server: 'Terjadi gangguan di server. Coba lagi sebentar lagi.',
  network: 'Koneksi terputus. Periksa jaringan, lalu coba lagi.',
  not_found: 'Data yang diminta tidak ditemukan.',
  conflict: 'Perubahan bentrok dengan data terbaru. Muat ulang halaman.',
  unauthorized: 'Sesi Anda berakhir. Silakan masuk kembali.',
  validation: 'Ada isian yang perlu diperbaiki.',
}

function jenisGalat(status: number): ApiError['kind'] {
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'unauthorized'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 422) return 'validation'
  if (status >= 500) return 'server'
  return 'server'
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const sesi = readSession()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (sesi) headers.Authorization = `Bearer ${sesi.token}`

  let respons: Response
  try {
    respons = await fetch(BASE_URL + path, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (galat) {
    if (galat instanceof DOMException && galat.name === 'AbortError') throw galat
    throw new ApiError('network', 0, pesanUmum.network)
  }

  if (respons.status === 204) return undefined as T

  const teks = await respons.text()
  const muatan = teks ? JSON.parse(teks) : {}

  if (!respons.ok) {
    const kind = jenisGalat(respons.status)
    const fields = kind === 'validation' ? (muatan.errors as Record<string, string>) : undefined
    throw new ApiError(kind, respons.status, muatan.message ?? pesanUmum[kind], fields)
  }

  return muatan as T
}
```

- [ ] **Step 7: Tulis data contoh dan handler**

`src/api/mocks/data/users.ts`:

```ts
import type { User } from '@/api/types'

export const users: User[] = [
  { id: 401, name: 'Admin Nusantara', email: 'admin@nusantarabooking.id', role: 'admin' },
  { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' },
  { id: 403, name: 'Bu Rina', email: 'rina@umkm.id', role: 'pemilik' },
  { id: 404, name: 'Rian Pratama', email: 'rian@mail.com', role: 'penyewa' },
  { id: 405, name: 'Siti Sarah', email: 'sarah@mail.com', role: 'penyewa' },
]
```

`src/api/mocks/data/units.ts`:

```ts
import type { Unit } from '@/api/types'

export const units: Unit[] = [
  { id: 1, owner_id: 402, name: 'Kos Kamar 01', address: 'Bandung Barat', price: 1200000, status: 'Tersedia' },
  { id: 2, owner_id: 402, name: 'Kos Kamar 02', address: 'Bandung Barat', price: 1250000, status: 'Terisi' },
  { id: 3, owner_id: 402, name: 'Kontrakan Melati', address: 'Cimahi', price: 2500000, status: 'Terisi' },
  { id: 4, owner_id: 403, name: 'Kos Kamar 04', address: 'Cimahi', price: 1100000, status: 'Tersedia' },
  { id: 5, owner_id: 403, name: 'Ruang Usaha A', address: 'Bandung', price: 3000000, status: 'Terisi' },
]
```

`src/api/mocks/handlers/auth.ts`:

```ts
import { http, HttpResponse } from 'msw'
import { users } from '@/api/mocks/data/users'

function tokenUntuk(userId: number) {
  return `mock.${btoa(JSON.stringify({ sub: userId }))}.tanda`
}

export const authHandlers = [
  http.post('/auth/login', async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string }
    const user = users.find((kandidat) => kandidat.email === email)
    if (!user) {
      return HttpResponse.json({ message: 'Email atau kata sandi tidak cocok.' }, { status: 401 })
    }
    if (!password || password.length < 8) {
      return HttpResponse.json(
        { message: 'Periksa isian.', errors: { password: 'Kata sandi kurang dari 8 karakter. Tambahkan sampai minimal 8 karakter.' } },
        { status: 422 },
      )
    }
    return HttpResponse.json({ token: tokenUntuk(user.id), user })
  }),

  http.get('/auth/me', ({ request }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token || !token.startsWith('mock.')) {
      return HttpResponse.json({ message: 'Sesi tidak sah.' }, { status: 401 })
    }
    const user = users.find((kandidat) => kandidat.id === 402)
    return HttpResponse.json({ user })
  }),
]
```

`src/api/mocks/handlers/units.ts`:

```ts
import { http, HttpResponse } from 'msw'
import { units } from '@/api/mocks/data/units'
import type { Unit } from '@/api/types'

/* Kegagalan disimulasikan sekali per kombinasi aksi supaya jalur galat dan
   tombol coba ulang bisa didemokan tanpa backend — sama seperti purwarupa. */
const sudahGagal = new Set<string>()

function gagalSekali(kunci: string) {
  if (sudahGagal.has(kunci)) return false
  sudahGagal.add(kunci)
  return true
}

export function resetSimulasi() {
  sudahGagal.clear()
}

let urutan = units.length

export const unitHandlers = [
  http.get('/units', () => {
    /* Peran dibaca dari token: pemilik hanya menerima unitnya sendiri.
       Ini juga yang menahan kebocoran unit milik pemilik lain. */
    const pemilik = 402
    return HttpResponse.json({ data: units.filter((unit) => unit.owner_id === pemilik) })
  }),

  http.get('/units/:id', ({ params }) => {
    const unit = units.find((kandidat) => kandidat.id === Number(params.id))
    if (!unit) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
    return HttpResponse.json({ data: unit })
  }),

  http.post('/units', async ({ request }) => {
    const muatan = (await request.json()) as Omit<Unit, 'id' | 'owner_id'>
    if (gagalSekali('POST /units')) {
      return HttpResponse.json({ message: 'Unit gagal disimpan karena koneksi terputus.' }, { status: 500 })
    }
    if (!muatan.name || !muatan.name.trim()) {
      return HttpResponse.json(
        { message: 'Periksa isian.', errors: { name: 'Nama unit belum diisi. Isi nama agar penyewa mudah mengenali unit ini.' } },
        { status: 422 },
      )
    }
    const unit: Unit = { id: ++urutan, owner_id: 402, ...muatan, price: Number(muatan.price) }
    units.push(unit)
    return HttpResponse.json({ data: unit }, { status: 201 })
  }),

  http.patch('/units/:id', async ({ params, request }) => {
    const unit = units.find((kandidat) => kandidat.id === Number(params.id))
    if (!unit) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
    const muatan = (await request.json()) as Partial<Unit>
    Object.assign(unit, muatan, { price: muatan.price === undefined ? unit.price : Number(muatan.price) })
    return HttpResponse.json({ data: unit })
  }),

  http.delete('/units/:id', ({ params }) => {
    if (gagalSekali('DELETE /units')) {
      return HttpResponse.json({ message: 'Unit gagal dihapus karena koneksi terputus.' }, { status: 500 })
    }
    const indeks = units.findIndex((kandidat) => kandidat.id === Number(params.id))
    if (indeks === -1) return HttpResponse.json({ message: 'Unit tidak ditemukan.' }, { status: 404 })
    units.splice(indeks, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
```

`src/api/mocks/handlers/index.ts`:

```ts
import { authHandlers } from '@/api/mocks/handlers/auth'
import { unitHandlers } from '@/api/mocks/handlers/units'

export const handlers = [...authHandlers, ...unitHandlers]
```

`src/api/mocks/server.ts`:

```ts
import { setupServer } from 'msw/node'
import { handlers } from '@/api/mocks/handlers'

export const server = setupServer(...handlers)
```

`src/api/mocks/browser.ts`:

```ts
import { setupWorker } from 'msw/browser'
import { handlers } from '@/api/mocks/handlers'

export const worker = setupWorker(...handlers)
```

Tambahkan penyalaan server MSW ke `src/test/setup.ts`:

```ts
import { server } from '@/api/mocks/server'
import { resetSimulasi } from '@/api/mocks/handlers/units'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetSimulasi()
})
afterAll(() => server.close())
```

- [ ] **Step 8: Tulis tes penyimpanan sesi yang gagal**

`src/features/auth/__tests__/session.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { clearSession, readSession, writeSession } from '@/features/auth/session'

const sesi = { token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' as const } }

describe('penyimpanan sesi', () => {
  beforeEach(() => localStorage.clear())

  it('mengembalikan null bila belum ada sesi', () => {
    expect(readSession()).toBeNull()
  })

  it('menyimpan dan membaca kembali sesi', () => {
    writeSession(sesi)
    expect(readSession()).toEqual(sesi)
  })

  it('memperlakukan JSON rusak sebagai belum masuk, tanpa melempar galat', () => {
    localStorage.setItem('nb.session', '{bukan json')
    expect(readSession()).toBeNull()
  })

  it('memperlakukan bentuk yang tidak lengkap sebagai belum masuk', () => {
    localStorage.setItem('nb.session', JSON.stringify({ token: 'ada' }))
    expect(readSession()).toBeNull()
  })

  it('mengembalikan acuan yang sama selama isi tidak berubah', () => {
    writeSession(sesi)
    expect(readSession()).toBe(readSession())
  })

  it('membersihkan kunci yang rusak supaya tidak dibaca berulang', () => {
    localStorage.setItem('nb.session', '{bukan json')
    readSession()
    expect(localStorage.getItem('nb.session')).toBeNull()
  })

  it('memberi tahu pelanggan saat sesi dibuang', () => {
    const dipanggil: number[] = []
    const lepas = subscribeSession(() => dipanggil.push(1))
    writeSession(sesi)
    clearSession()
    lepas()
    expect(dipanggil).toHaveLength(2)
  })
})
```

- [ ] **Step 9: Jalankan untuk memastikan gagal**

```bash
bun run test src/features/auth/__tests__/session.test.ts
```

Expected: gagal dengan `Failed to resolve import "@/features/auth/session"`.

- [ ] **Step 10: Tulis penyimpanan sesi lalu jalankan sampai lolos**

`src/features/auth/session.ts`:

```ts
import { useSyncExternalStore } from 'react'
import type { Role } from '@/api/types'

export type Session = { token: string; user: { id: number; name: string; email: string; role: Role } }

const KUNCI = 'nb.session'
const pendengar = new Set<() => void>()
let tersimpan: Session | null = null
let terakhirDibaca: string | null = null

function sahkan(nilai: unknown): Session | null {
  if (!nilai || typeof nilai !== 'object') return null
  const kandidat = nilai as Partial<Session>
  const user = kandidat.user as Session['user'] | undefined
  if (typeof kandidat.token !== 'string' || !kandidat.token) return null
  if (!user || typeof user.id !== 'number' || typeof user.role !== 'string' || typeof user.email !== 'string') return null
  return { token: kandidat.token, user: { id: user.id, name: String(user.name ?? ''), email: user.email, role: user.role } }
}

function beritahu() {
  pendengar.forEach((fn) => fn())
}

/* Membaca dari localStorage dengan satu acuan yang stabil selama isinya tidak
   berubah — syarat useSyncExternalStore. Bentuk yang rusak diperlakukan sebagai
   belum masuk, bukan sebagai galat. */
export function readSession(): Session | null {
  const mentah = localStorage.getItem(KUNCI)
  if (mentah === terakhirDibaca) return tersimpan
  terakhirDibaca = mentah
  if (!mentah) {
    tersimpan = null
    return tersimpan
  }
  try {
    tersimpan = sahkan(JSON.parse(mentah))
  } catch {
    tersimpan = null
  }
  if (!tersimpan) localStorage.removeItem(KUNCI)
  return tersimpan
}

export function writeSession(sesi: Session) {
  localStorage.setItem(KUNCI, JSON.stringify(sesi))
  terakhirDibaca = null
  beritahu()
}

export function clearSession() {
  localStorage.removeItem(KUNCI)
  terakhirDibaca = null
  beritahu()
}

export function subscribeSession(fn: () => void) {
  pendengar.add(fn)
  return () => pendengar.delete(fn)
}

export function useStoredSession(): Session | null {
  return useSyncExternalStore(subscribeSession, readSession, () => null)
}
```

```bash
bun run test src/features/auth/__tests__/session.test.ts
```

Expected: tujuh tes lolos.

- [ ] **Step 11: Tulis tes klien yang gagal**

`src/api/__tests__/client.test.ts`:

```ts
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { apiFetch } from '@/api/client'
import { ApiError } from '@/api/types'
import { server } from '@/api/mocks/server'
import { writeSession } from '@/features/auth/session'

describe('apiFetch', () => {
  it('menyisipkan token dari sesi', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    let terlihat: string | null = null
    server.use(
      http.get('/percobaan', ({ request }) => {
        terlihat = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )
    await apiFetch('/percobaan')
    expect(terlihat).toBe('Bearer mock.abc.tanda')
  })

  it('memetakan 422 menjadi galat isian per bidang', async () => {
    server.use(
      http.post('/percobaan', () =>
        HttpResponse.json({ message: 'Periksa isian.', errors: { name: 'Nama unit belum diisi.' } }, { status: 422 }),
      ),
    )
    await expect(apiFetch('/percobaan', { method: 'POST', body: {} })).rejects.toMatchObject({
      kind: 'validation',
      fields: { name: 'Nama unit belum diisi.' },
    })
  })

  it('memetakan 401 menjadi galat sesi', async () => {
    server.use(http.get('/percobaan', () => HttpResponse.json({ message: 'Sesi tidak sah.' }, { status: 401 })))
    const galat = await apiFetch('/percobaan').catch((e) => e)
    expect(galat).toBeInstanceOf(ApiError)
    expect(galat.kind).toBe('unauthorized')
  })

  it('memetakan 500 menjadi galat server yang bisa diulang', async () => {
    server.use(http.get('/percobaan', () => HttpResponse.json({ message: 'Koneksi terputus.' }, { status: 500 })))
    await expect(apiFetch('/percobaan')).rejects.toMatchObject({ kind: 'server', status: 500 })
  })

  it('memetakan kegagalan jaringan menjadi galat jaringan', async () => {
    server.use(http.get('/percobaan', () => HttpResponse.error()))
    await expect(apiFetch('/percobaan')).rejects.toMatchObject({ kind: 'network' })
  })
})
```

- [ ] **Step 12: Jalankan sampai lolos**

Tes klien memakai `writeSession` dari langkah 10, jadi kerjakan berurutan.

```bash
bun run test src/api src/features/auth src/lib
```

Expected: seluruh tes Task 3 lolos.

- [ ] **Step 13: Commit**

```bash
git add src/api src/lib src/features/auth public/mockServiceWorker.js src/test/setup.ts package.json bun.lock
git commit -m "feat(api): penyimpanan sesi, klien HTTP, kontrak tipe, dan batas mock MSW"
```

---

### Task 4: Peran, hook sesi, dan halaman masuk

**Files:**
- Create: `src/features/auth/roles.ts`, `src/features/auth/api.ts`, `src/features/auth/schema.ts`, `src/features/auth/pages/login-page.tsx`, `src/features/auth/__tests__/login-page.test.tsx`
- Modify: `src/test/setup.ts` (bila perlu jenis tes tambahan)

**Interfaces:**
- Consumes:
  - `src/features/auth/session.ts` dari Task 3: `type Session`, `readSession()`, `writeSession(s)`, `clearSession()`, `subscribeSession(fn)`, `useStoredSession()`.
  - `apiFetch`, `ApiError`, `User`, `Role` dari Task 3.
- Produces:
  - `toDataRole(role: Role): 'renter' | 'owner' | 'admin'`, `labelPeran(role: Role): string`
  - `useSession(): { session: Session | null; isLoading: boolean }`, `useLogin()`, `useLogout()`
  - `LoginPage` dari `@/features/auth/pages/login-page`.

- [ ] **Step 1: Tulis pemetaan peran**

`src/features/auth/roles.ts`:

```ts
import type { Role } from '@/api/types'

/* Nilai atribut `data-role` yang dikenali tokens.css hanya `renter` dan `owner`;
   admin sengaja memakai aksen bawaan. */
export function toDataRole(role: Role): 'renter' | 'owner' | 'admin' {
  if (role === 'penyewa') return 'renter'
  if (role === 'pemilik') return 'owner'
  return 'admin'
}

export function labelPeran(role: Role): string {
  if (role === 'penyewa') return 'Penyewa'
  if (role === 'pemilik') return 'Pemilik'
  return 'Admin'
}
```

Penyimpanan sesi beserta tesnya sudah dibuat di Task 3 langkah 8–10 karena klien HTTP memakainya; di sini hanya pemetaan peran yang ditambahkan.

- [ ] **Step 2: Tulis hook sesi**

`src/features/auth/api.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import { ApiError, type User } from '@/api/types'
import { clearSession, readSession, useStoredSession, writeSession, type Session } from '@/features/auth/session'

export function useSession(): { session: Session | null; isLoading: boolean } {
  const tersimpan = useStoredSession()
  const query = useQuery({
    queryKey: ['auth', 'me', tersimpan?.user.id ?? 0],
    enabled: Boolean(tersimpan),
    retry: false,
    staleTime: Infinity,
    queryFn: async (): Promise<Session> => {
      const { user } = await apiFetch<{ user: User }>('/auth/me')
      const sesi = { token: tersimpan!.token, user }
      writeSession(sesi)
      return sesi
    },
  })

  if (!tersimpan) return { session: null, isLoading: false }
  if (query.isError && query.error instanceof ApiError && query.error.kind === 'unauthorized') {
    clearSession()
    return { session: null, isLoading: false }
  }
  return { session: query.data ?? tersimpan, isLoading: query.isPending }
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (masukan: { email: string; password: string }) =>
      apiFetch<{ token: string; user: User }>('/auth/login', { method: 'POST', body: masukan }),
    onSuccess: (hasil) => {
      writeSession({ token: hasil.token, user: hasil.user })
      queryClient.setQueryData(['auth', 'me', hasil.user.id], { token: hasil.token, user: hasil.user })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return () => {
    clearSession()
    queryClient.clear()
  }
}
```

- [ ] **Step 3: Tulis skema dan halaman masuk**

`src/features/auth/schema.ts`:

```ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email atau nomor WhatsApp belum diisi. Isi agar pemilik dapat menghubungi Anda.'),
  password: z
    .string()
    .min(1, 'Kata sandi belum diisi. Isi sekurangnya 8 karakter.')
    .min(8, 'Kata sandi kurang dari 8 karakter. Tambahkan sampai minimal 8 karakter.'),
})

export type LoginValues = z.infer<typeof loginSchema>
```

`src/features/auth/pages/login-page.tsx`:

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { ApiError } from '@/api/types'
import { useLogin } from '@/features/auth/api'
import { loginSchema, type LoginValues } from '@/features/auth/schema'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

export function LoginPage() {
  const masuk = useLogin()
  const navigate = useNavigate()
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const onSubmit = form.handleSubmit((nilai) => {
    masuk.mutate(nilai, {
      onSuccess: () => navigate('/pemilik', { replace: true }),
      onError: (galat) => {
        if (galat instanceof ApiError && galat.kind === 'validation' && galat.fields) {
          Object.entries(galat.fields).forEach(([bidang, pesan]) => {
            form.setError(bidang as keyof LoginValues, { message: pesan })
          })
        }
      },
    })
  })

  return (
    <section className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-heading-l font-bold text-brand-text">Masuk</h1>
      <p className="mt-1 text-body text-brand-text-muted">Kelola unit, kontrak, dan tagihan dari satu tempat.</p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4 rounded-xl border border-brand-border bg-brand-surface p-6 shadow-sm">
        {masuk.isError && !form.formState.errors.email && (
          <p role="alert" className="rounded-md border border-brand-danger-border bg-brand-danger-soft p-3 text-ui text-brand-danger-soft-fg">
            {(masuk.error as Error).message}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email / Nomor WhatsApp</Label>
          <Input id="email" type="text" autoComplete="username" aria-invalid={Boolean(form.formState.errors.email)} {...form.register('email')} />
          {form.formState.errors.email && <p className="text-ui text-brand-danger">{form.formState.errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Kata sandi</Label>
          <Input id="password" type="password" autoComplete="current-password" aria-invalid={Boolean(form.formState.errors.password)} {...form.register('password')} />
          {form.formState.errors.password && <p className="text-ui text-brand-danger">{form.formState.errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={masuk.isPending}>
          {masuk.isPending ? 'Memeriksa…' : 'Masuk'}
        </Button>
      </form>

      <p className="mt-4 text-ui text-brand-text-muted">
        Akun demo: wahyu@umkm.id (Pemilik), rina@umkm.id (Pemilik), admin@nusantarabooking.id (Admin). Kata sandi apa pun minimal 8 karakter.
      </p>
    </section>
  )
}
```

- [ ] **Step 4: Tulis tes halaman masuk**

`src/features/auth/__tests__/login-page.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LoginPage } from '@/features/auth/pages/login-page'
import { readSession } from '@/features/auth/session'
import { renderWithProviders } from '@/test/render'

function renderHalaman() {
  return renderWithProviders(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('menolak kata sandi pendek tanpa memanggil server', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'pendek')
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(await screen.findByText(/Kata sandi kurang dari 8 karakter/i)).toBeInTheDocument()
    expect(readSession()).toBeNull()
  })

  it('menyimpan sesi saat kredensial cocok', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Email / Nomor WhatsApp'), 'wahyu@umkm.id')
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123')
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    await waitFor(() => expect(readSession()?.user.email).toBe('wahyu@umkm.id'))
    expect(readSession()?.user.role).toBe('pemilik')
  })

  it('menampilkan pesan saat email tidak dikenal', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Email / Nomor WhatsApp'), 'tidak@ada.id')
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123')
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/tidak cocok/i)
  })
})
```

- [ ] **Step 5: Jalankan sampai lolos**

```bash
bun run test src/features/auth
bun run check:styles
```

Expected: seluruh tes lolos dan tidak ada kelas warna mentah.

- [ ] **Step 6: Commit**

```bash
git add src/features/auth
git commit -m "feat(auth): pemetaan peran, hook sesi, dan halaman masuk"
```

---

### Task 5: Komponen keadaan layar bersama

**Files:**
- Create: `src/ui/skeleton.tsx`, `src/ui/empty-state.tsx`, `src/ui/error-state.tsx`, `src/ui/toast.tsx`, `src/ui/__tests__/states.test.tsx`
- Modify: `src/styles/index.css` (animasi berdenyut memakai `--gradient-shimmer`)

**Interfaces:**
- Produces:
  - `<Skeleton className?>` — blok berdenyut.
  - `<EmptyState title description action? />`
  - `<ErrorState message onRetry? />`
  - `<ToastProvider>` dan `useToast(): { tampilkan(pesan: string, jenis?: 'success' | 'danger' | 'info'): void }`.

- [ ] **Step 1: Tulis tes keadaan yang gagal**

`src/ui/__tests__/states.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState } from '@/ui/empty-state'
import { ErrorState } from '@/ui/error-state'
import { renderWithProviders } from '@/test/render'

describe('EmptyState', () => {
  it('menampilkan sebab dan aksi', () => {
    renderWithProviders(<EmptyState title="Belum ada unit" description="Tambahkan unit pertama Anda." action={<button>Tambah Unit Baru</button>} />)
    expect(screen.getByText('Belum ada unit')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tambah Unit Baru' })).toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('menampilkan sebab dan memanggil coba ulang', async () => {
    const ulang = vi.fn()
    renderWithProviders(<ErrorState message="Koneksi terputus." onRetry={ulang} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Koneksi terputus.')
    await userEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    expect(ulang).toHaveBeenCalledOnce()
  })

  it('tidak menampilkan tombol bila tidak ada coba ulang', () => {
    renderWithProviders(<ErrorState message="Unit tidak ditemukan." />)
    expect(screen.queryByRole('button', { name: 'Coba Lagi' })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Jalankan untuk memastikan gagal**

```bash
bun run test src/ui/__tests__/states.test.tsx
```

Expected: gagal karena modul belum ada.

- [ ] **Step 3: Tulis komponennya**

`src/ui/skeleton.tsx`:

```tsx
import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('block animate-pulse rounded-md bg-brand-surface-sunken', className)} />
}
```

Pembantu `cn` di `src/lib/utils.ts` sudah dibuat oleh `shadcn init` pada Task 2, beserta `clsx` dan `tailwind-merge`; jangan buat berkas pembantu kedua.

`src/ui/empty-state.tsx`:

```tsx
import type { ReactNode } from 'react'

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-brand-border-strong bg-brand-surface p-8 text-center">
      <h3 className="text-heading-s font-bold text-brand-text">{title}</h3>
      <p className="mx-auto mt-1 max-w-prose text-body text-brand-text-muted">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
```

`src/ui/error-state.tsx`:

```tsx
import { Button } from '@/ui/button'

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-brand-danger-border bg-brand-danger-soft p-6">
      <p className="text-body text-brand-danger-soft-fg">{message}</p>
      {onRetry && (
        <Button variant="destructive" className="mt-3" onClick={onRetry}>
          Coba Lagi
        </Button>
      )}
    </div>
  )
}
```

`src/ui/toast.tsx`:

```tsx
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type JenisToast = 'success' | 'danger' | 'info'
type Toast = { id: number; pesan: string; jenis: JenisToast }

const ToastContext = createContext<{ tampilkan: (pesan: string, jenis?: JenisToast) => void } | null>(null)

const warnaTepi: Record<JenisToast, string> = {
  success: 'border-l-brand-success',
  danger: 'border-l-brand-danger',
  info: 'border-l-brand-accent',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [daftar, setDaftar] = useState<Toast[]>([])

  const tampilkan = useCallback((pesan: string, jenis: JenisToast = 'info') => {
    const id = Date.now() + Math.random()
    setDaftar((lama) => [...lama, { id, pesan, jenis }])
    setTimeout(() => setDaftar((lama) => lama.filter((toast) => toast.id !== id)), 4500)
  }, [])

  const nilai = useMemo(() => ({ tampilkan }), [tampilkan])

  return (
    <ToastContext.Provider value={nilai}>
      {children}
      <div role="status" aria-live="polite" className="fixed right-4 top-4 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {daftar.map((toast) => (
          <div key={toast.id} className={`rounded-lg border border-brand-border border-l-4 bg-brand-surface p-4 shadow-lg ${warnaTepi[toast.jenis]}`}>
            <p className="text-ui font-medium text-brand-text">{toast.pesan}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const nilai = useContext(ToastContext)
  if (!nilai) throw new Error('useToast dipakai di luar ToastProvider')
  return nilai
}
```

Pasang `clsx` dan `tailwind-merge` hanya bila `shadcn init` belum memasangnya: `bun add clsx tailwind-merge`.

- [ ] **Step 4: Jalankan sampai lolos**

```bash
bun run test src/ui/__tests__/states.test.tsx
bun run check:styles
```

Expected: tiga tes lolos, pagar gaya lolos. Perhatikan `border-l-brand-success` dan sejenisnya lolos karena memakai awalan `brand-`.

- [ ] **Step 5: Commit**

```bash
git add src/ui
git commit -m "feat(ui): keadaan memuat, kosong, galat, dan toast"
```

---

### Task 6: Kerangka aplikasi, tata letak per peran, dan penjaga rute

**Files:**
- Create: `src/app/providers.tsx`, `src/app/router.tsx`, `src/app/guards.tsx`, `src/app/layouts/app-shell.tsx`, `src/lib/use-theme.ts`, `src/app/pages/forbidden-page.tsx`, `src/app/__tests__/guards.test.tsx`, `src/lib/__tests__/use-theme.test.ts`, `src/features/units/pages/unit-list-page.tsx` (pengganti sementara), `src/features/units/pages/unit-form-page.tsx` (pengganti sementara), `src/features/dashboard/pages/owner-dashboard-page.tsx` (pengganti sementara)
- Modify: `src/App.tsx`, `src/main.tsx`, `.env.example`

**Interfaces:**
- Consumes: `useSession()` (Task 4), `toDataRole`/`labelPeran` (Task 4), `ToastProvider` (Task 5).
- Produces:
  - `<App />` merender `RouterProvider`.
  - `<RequireRole role="pemilik" | "penyewa" | "admin">` dan `<RequireSession>`.
  - `<AppShell>` memasang `data-theme` dan `data-role` pada `document.documentElement`.
  - `useTheme(): { theme: 'light' | 'dark'; toggle(): void }`.
  - Rute: `/masuk`, `/403`, `/pemilik`, `/pemilik/unit`, `/pemilik/unit/baru`.

- [ ] **Step 1: Tulis tes hook tema yang gagal**

`src/lib/__tests__/use-theme.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTheme } from '@/lib/use-theme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('memasang tema terang secara bawaan', () => {
    renderHook(() => useTheme())
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('mengganti tema dan mengingatnya', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle())
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('nb.theme')).toBe('dark')
  })
})
```

- [ ] **Step 2: Jalankan untuk memastikan gagal**

```bash
bun run test src/lib/__tests__/use-theme.test.ts
```

Expected: gagal karena modul belum ada.

- [ ] **Step 3: Tulis hook tema dan kerangka tata letak**

`src/lib/use-theme.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const KUNCI = 'nb.theme'

function bacaAwal(): Theme {
  const tersimpan = localStorage.getItem(KUNCI)
  return tersimpan === 'dark' ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(bacaAwal)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(KUNCI, theme)
  }, [theme])

  const toggle = useCallback(() => setTheme((lama) => (lama === 'dark' ? 'light' : 'dark')), [])
  return { theme, toggle }
}
```

`src/app/layouts/app-shell.tsx`:

```tsx
import { useEffect } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { labelPeran, toDataRole } from '@/features/auth/roles'
import { useLogout, useSession } from '@/features/auth/api'
import { useTheme } from '@/lib/use-theme'
import { Button } from '@/ui/button'

/* Tata letak akar: memasang atribut tema dan peran pada elemen <html>, dan
   mengembalikan posisi gulir saat pengguna kembali satu tingkat. */
export function AppShell() {
  const { session } = useSession()
  const { theme, toggle } = useTheme()
  const keluar = useLogout()

  useEffect(() => {
    document.documentElement.dataset.role = session ? toDataRole(session.user.role) : 'renter'
  }, [session])

  return (
    <div className="flex min-h-screen flex-col bg-brand-bg text-brand-text">
      <header className="sticky top-0 z-10 border-b border-brand-border bg-brand-surface">
        <div className="mx-auto flex h-appbar max-w-container items-center gap-4 px-4">
          <span className="font-heading text-heading-s font-bold">Nusantara Booking</span>
          <span className="ml-auto text-ui text-brand-text-muted">{session ? session.user.name : ''}</span>
          {session && <span className="text-micro uppercase tracking-wider text-brand-text-subtle">{labelPeran(session.user.role)}</span>}
          <Button variant="ghost" onClick={toggle} aria-label={theme === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'}>
            {theme === 'dark' ? 'Terang' : 'Gelap'}
          </Button>
          {session && (
            <Button variant="outline" onClick={keluar}>
              Keluar
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-brand-border bg-brand-surface py-6 text-center text-micro text-brand-text-subtle">
        © 2026 Nusantara Booking — Sistem Pengelolaan & Sewa Properti Terpadu UMKM
      </footer>
      <ScrollRestoration />
    </div>
  )
}
```

`src/app/pages/forbidden-page.tsx`:

```tsx
import { Link } from 'react-router'

export function ForbiddenPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-heading-l font-bold text-brand-text">Halaman ini bukan untuk peran Anda</h1>
      <p className="mt-2 text-body text-brand-text-muted">Akun yang sedang masuk tidak punya akses ke bagian ini.</p>
      <Link className="mt-4 inline-block font-semibold text-brand-accent" to="/">
        Kembali ke beranda
      </Link>
    </section>
  )
}
```

- [ ] **Step 4: Tulis penjaga, pengganti sementara, dan router**

Tiga halaman ini dibuat sebagai pengganti sementara supaya router bisa berdiri dan diuji sekarang; Task 8, 9, dan 10 menggantinya dengan halaman sebenarnya.

`src/features/units/pages/unit-list-page.tsx`:

```tsx
export function UnitListPage() {
  return <p className="p-8 text-body text-brand-text-muted">Daftar unit menyusul.</p>
}
```

`src/features/units/pages/unit-form-page.tsx`:

```tsx
export function UnitFormPage() {
  return <p className="p-8 text-body text-brand-text-muted">Formulir unit menyusul.</p>
}
```

`src/features/dashboard/pages/owner-dashboard-page.tsx`:

```tsx
export function OwnerDashboardPage() {
  return <p className="p-8 text-body text-brand-text-muted">Dashboard pemilik menyusul.</p>
}
```

`src/app/guards.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Role } from '@/api/types'
import { useSession } from '@/features/auth/api'

export function RequireSession({ children }: { children: ReactNode }) {
  const { session, isLoading } = useSession()
  if (isLoading) return <p className="p-8 text-body text-brand-text-muted">Memeriksa sesi…</p>
  if (!session) return <Navigate to="/masuk" replace />
  return <>{children}</>
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session, isLoading } = useSession()
  if (isLoading) return <p className="p-8 text-body text-brand-text-muted">Memeriksa sesi…</p>
  if (!session) return <Navigate to="/masuk" replace />
  if (session.user.role !== role) return <Navigate to="/403" replace />
  return <>{children}</>
}
```

`src/app/router.tsx`:

```tsx
import { createBrowserRouter } from 'react-router'
import { ForbiddenPage } from '@/app/pages/forbidden-page'
import { RequireRole } from '@/app/guards'
import { AppShell } from '@/app/layouts/app-shell'
import { LoginPage } from '@/features/auth/pages/login-page'
import { OwnerDashboardPage } from '@/features/dashboard/pages/owner-dashboard-page'
import { UnitFormPage } from '@/features/units/pages/unit-form-page'
import { UnitListPage } from '@/features/units/pages/unit-list-page'

/* AppShell adalah tata letak akar: semua rute berada di dalamnya, sehingga
   bilah atas, tombol tema, dan atribut peran terpasang di setiap layar. */
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/masuk', element: <LoginPage /> },
      { path: '/403', element: <ForbiddenPage /> },
      { path: '/', element: <RequireRole role="penyewa"><p className="p-8">Katalog menyusul.</p></RequireRole> },
      { path: '/pemilik', element: <RequireRole role="pemilik"><OwnerDashboardPage /></RequireRole> },
      { path: '/pemilik/unit', element: <RequireRole role="pemilik"><UnitListPage /></RequireRole> },
      { path: '/pemilik/unit/baru', element: <RequireRole role="pemilik"><UnitFormPage /></RequireRole> },
    ],
  },
])
```

`src/app/providers.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { ToastProvider } from '@/ui/toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: (jumlah, galat) => jumlah < 1 && (galat as { kind?: string }).kind === 'network' },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  const [siap, setSiap] = useState(import.meta.env.VITE_API_MOCK !== 'on')

  useEffect(() => {
    if (import.meta.env.VITE_API_MOCK !== 'on') return
    let batal = false
    import('@/api/mocks/browser').then(async ({ worker }) => {
      await worker.start({ onUnhandledRequest: 'bypass' })
      if (!batal) setSiap(true)
    })
    return () => { batal = true }
  }, [])

  if (!siap) return <p className="p-8 text-body text-brand-text-muted">Menyiapkan data contoh…</p>

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  )
}
```

`src/App.tsx`:

```tsx
import { RouterProvider } from 'react-router'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'

export default function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  )
}
```

`.env.example`:

```
# Alamat API Laravel. Kosongkan untuk memakai jalur relatif.
VITE_API_BASE_URL=
# on = pakai data contoh lewat MSW; off = memanggil API sungguhan.
VITE_API_MOCK=on
```

- [ ] **Step 5: Tulis tes penjaga dan atribut peran**

`src/app/__tests__/guards.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { RequireRole } from '@/app/guards'
import { writeSession } from '@/features/auth/session'
import { renderWithProviders } from '@/test/render'

function renderDenganPenjaga(peran: 'pemilik' | 'penyewa') {
  writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: peran } })
  return renderWithProviders(
    <MemoryRouter initialEntries={['/pemilik/unit']}>
      <Routes>
        <Route path="/masuk" element={<p>Layar masuk</p>} />
        <Route path="/403" element={<p>Tidak diizinkan</p>} />
        <Route
          path="/pemilik/unit"
          element={
            <RequireRole role="pemilik">
              <p>Daftar unit</p>
            </RequireRole>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireRole', () => {
  it('mengantar ke layar masuk bila belum ada sesi', async () => {
    localStorage.clear()
    renderWithProviders(
      <MemoryRouter initialEntries={['/pemilik/unit']}>
        <Routes>
          <Route path="/masuk" element={<p>Layar masuk</p>} />
          <Route path="/pemilik/unit" element={<RequireRole role="pemilik"><p>Daftar unit</p></RequireRole>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Layar masuk')).toBeInTheDocument()
  })

  it('mengantar ke 403 bila peran tidak cocok', async () => {
    renderDenganPenjaga('penyewa')
    expect(await screen.findByText('Tidak diizinkan')).toBeInTheDocument()
  })

  it('menampilkan isi bila peran cocok', async () => {
    renderDenganPenjaga('pemilik')
    await waitFor(() => expect(screen.getByText('Daftar unit')).toBeInTheDocument())
  })

  it('sesi kedaluwarsa saat aplikasi terbuka diantar kembali ke layar masuk', async () => {
    const { server } = await import('@/api/mocks/server')
    const { http, HttpResponse } = await import('msw')
    server.use(http.get('/auth/me', () => HttpResponse.json({ message: 'Sesi tidak sah.' }, { status: 401 })))
    renderDenganPenjaga('pemilik')
    expect(await screen.findByText('Layar masuk')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Jalankan sampai lolos**

```bash
bun run test src/app src/lib
bun run typecheck
bun run check:styles
```

Expected: seluruh tes lolos, termasuk tes 401 di tengah pemakaian; `typecheck` dan `check:styles` lolos.

- [ ] **Step 7: Verifikasi di browser dengan data contoh**

```bash
VITE_API_MOCK=on bun run dev
```

Buka `http://localhost:5173/masuk`, masuk dengan `wahyu@umkm.id` dan kata sandi apa pun minimal 8 karakter. Expected: berpindah ke `/pemilik`, atribut `data-role="owner"` dan `data-theme="light"` ada di elemen `<html>`, menekan tombol tema mengubah latar jadi `#0b1220`. Hentikan server setelah selesai.

- [ ] **Step 8: Commit**

```bash
git add src/app src/lib src/App.tsx src/main.tsx .env.example
git commit -m "feat(app): router per peran, tata letak, tema, dan penjaga sesi"
```

---

### Task 7: Data unit

**Files:**
- Create: `src/features/units/api.ts`, `src/features/units/schema.ts`, `src/features/units/__tests__/units-api.test.ts`
- Modify: `src/api/mocks/handlers/units.ts` (bila perlu menyesuaikan bentuk balasan)

**Interfaces:**
- Consumes: `apiFetch` (Task 3), `ApiError` (Task 3), `useSession` (Task 4).
- Produces:
  - `unitKeys = { list: (userId: number) => readonly ['units', { userId: number }], detail: (id: number) => readonly ['unit', number] }`
  - `useUnits(): UseQueryResult<Unit[]>`, `useUnit(id: number)`, `useCreateUnit()`, `useUpdateUnit()`, `useDeleteUnit()`
    — `useUpdateUnit` dipanggil tanpa argumen; `id` dikirim saat `mutate({ id, ...perubahan })`
  - `unitFormSchema`, `type UnitFormValues = { name: string; address: string; price: number; status: UnitStatus }`

- [ ] **Step 1: Tulis tes hook unit yang gagal**

`src/features/units/__tests__/units-api.test.ts`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useCreateUnit, useUnits } from '@/features/units/api'
import { writeSession } from '@/features/auth/session'
import type { ReactNode } from 'react'

function pembungkus() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useUnits', () => {
  it('hanya mengembalikan unit milik pemilik yang sedang masuk', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    const { result } = renderHook(() => useUnits(), { wrapper: pembungkus() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(3)
    expect(result.current.data?.every((unit) => unit.owner_id === 402)).toBe(true)
  })
})

describe('useCreateUnit', () => {
  it('menormalkan harga berbentuk string desimal dari formulir', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    const { result } = renderHook(() => useCreateUnit(), { wrapper: pembungkus() })
    result.current.mutate({ name: 'Kos Kamar 09', address: 'Bandung', price: '1200000.00' as unknown as number, status: 'Tersedia' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.price).toBe(1200000)
  })
})
```

- [ ] **Step 2: Jalankan untuk memastikan gagal**

```bash
bun run test src/features/units
```

Expected: gagal karena modul belum ada.

- [ ] **Step 3: Tulis skema dan hook**

`src/features/units/schema.ts`:

```ts
import { z } from 'zod'

export const unitFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama unit belum diisi. Isi nama agar penyewa mudah mengenali unit ini.'),
  address: z.string().trim().min(1, 'Lokasi belum diisi. Tulis lokasi singkat, misalnya Bandung Barat.'),
  price: z.coerce
    .number({ message: 'Harga belum diisi atau bukan angka. Masukkan harga per bulan, misalnya 1200000.' })
    .positive('Harga harus lebih besar dari nol. Masukkan harga per bulan, misalnya 1200000.'),
  status: z.enum(['Tersedia', 'Terisi']),
})

export type UnitFormValues = z.infer<typeof unitFormSchema>
```

`src/features/units/api.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/api/client'
import type { Unit } from '@/api/types'
import { useSession } from '@/features/auth/api'
import { parseAmount } from '@/lib/format'

export const unitKeys = {
  list: (userId: number) => ['units', { userId }] as const,
  detail: (id: number) => ['unit', id] as const,
}

function normalisasi(unit: Unit): Unit {
  return { ...unit, price: parseAmount(unit.price) }
}

export function useUnits() {
  const { session } = useSession()
  const userId = session?.user.id ?? 0
  return useQuery({
    queryKey: unitKeys.list(userId),
    enabled: Boolean(session),
    queryFn: async (): Promise<Unit[]> => {
      const hasil = await apiFetch<{ data: Unit[] }>('/units')
      return hasil.data.map(normalisasi)
    },
  })
}

export function useUnit(id: number) {
  return useQuery({
    queryKey: unitKeys.detail(id),
    queryFn: async (): Promise<Unit> => {
      const hasil = await apiFetch<{ data: Unit }>(`/units/${id}`)
      return normalisasi(hasil.data)
    },
  })
}

export function useCreateUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (nilai: Omit<Unit, 'id' | 'owner_id'>) => {
      const hasil = await apiFetch<{ data: Unit }>('/units', {
        method: 'POST',
        body: { ...nilai, price: parseAmount(nilai.price) },
      })
      return normalisasi(hasil.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['units'] }),
  })
}

export function useUpdateUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...nilai }: { id: number } & Partial<Omit<Unit, 'id' | 'owner_id'>>) => {
      const hasil = await apiFetch<{ data: Unit }>(`/units/${id}`, {
        method: 'PATCH',
        body: { ...nilai, price: nilai.price === undefined ? undefined : parseAmount(nilai.price) },
      })
      return normalisasi(hasil.data)
    },
    onSuccess: (_hasil, variabel) => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variabel.id) })
    },
  })
}

export function useDeleteUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/units/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['units'] }),
  })
}
```

- [ ] **Step 4: Jalankan sampai lolos**

```bash
bun run test src/features/units
```

Expected: dua tes lolos. Bila tes pertama mengembalikan 5 unit, berarti handler `GET /units` belum menyaring per pemilik — perbaiki di `src/api/mocks/handlers/units.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/features/units src/api/mocks
git commit -m "feat(units): hook data unit di atas kontrak yang sama"
```

---

### Task 8: Halaman daftar unit pemilik

**Files:**
- Create: `src/features/units/components/unit-table.tsx`, `src/features/units/components/delete-unit-dialog.tsx`, `src/features/units/__tests__/unit-list-page.test.tsx`
- Modify: `src/features/units/pages/unit-list-page.tsx` (ganti pengganti sementara dari Task 6)

**Interfaces:**
- Consumes: `useUnits`, `useUpdateUnit`, `useDeleteUnit` (Task 7), `Skeleton`/`EmptyState`/`ErrorState` (Task 5), `useToast` (Task 5), `apiFetch`'s `ApiError` (Task 3).
- Produces: `UnitListPage` (rute `/pemilik/unit`).

- [ ] **Step 1: Tulis tes halaman yang gagal**

`src/features/units/__tests__/unit-list-page.test.tsx`:

```tsx
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { UnitListPage } from '@/features/units/pages/unit-list-page'
import { writeSession } from '@/features/auth/session'
import { renderWithProviders } from '@/test/render'

function renderHalaman() {
  writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
  return renderWithProviders(
    <MemoryRouter initialEntries={['/pemilik/unit']}>
      <UnitListPage />
    </MemoryRouter>,
  )
}

describe('UnitListPage', () => {
  it('menampilkan rangka bayangan lebih dulu, lalu daftar unit milik pemilik', async () => {
    renderHalaman()
    expect(screen.getAllByTestId('baris-rangka').length).toBeGreaterThan(0)
    await waitFor(() => expect(screen.getByText('Kos Kamar 01')).toBeInTheDocument())
    expect(screen.queryByText('Kos Kamar 04')).not.toBeInTheDocument()
  })

  it('mengubah status unit dan memperbarui barisnya', async () => {
    renderHalaman()
    const baris = (await screen.findByText('Kos Kamar 01')).closest('tr')!
    await userEvent.click(within(baris).getByRole('button', { name: /Ubah status/i }))
    await waitFor(() => expect(within(baris).getByText('Terisi')).toBeInTheDocument())
  })

  it('menghapus unit hanya setelah disetujui, dan batal tidak mengubah apa pun', async () => {
    renderHalaman()
    const baris = (await screen.findByText('Kos Kamar 02')).closest('tr')!
    await userEvent.click(within(baris).getByRole('button', { name: /Hapus/i }))
    await userEvent.click(await screen.findByRole('button', { name: 'Batal' }))
    expect(screen.getByText('Kos Kamar 02')).toBeInTheDocument()

    await userEvent.click(within(baris).getByRole('button', { name: /Hapus/i }))
    await userEvent.click(await screen.findByRole('button', { name: 'Hapus unit' }))
    await waitFor(() => expect(screen.queryByText('Kos Kamar 02')).not.toBeInTheDocument())
  })

  it('menampilkan galat bersebab dan coba ulang saat jaringan gagal', async () => {
    const { server } = await import('@/api/mocks/server')
    const { http, HttpResponse } = await import('msw')
    server.use(http.get('/units', () => HttpResponse.error()))
    renderHalaman()
    expect(await screen.findByRole('alert')).toHaveTextContent(/Koneksi terputus/i)
    expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Jalankan untuk memastikan gagal**

```bash
bun run test src/features/units/__tests__/unit-list-page.test.tsx
```

Expected: gagal karena halaman belum ada.

- [ ] **Step 3: Tulis tabel, dialog, dan halaman**

`src/features/units/components/unit-table.tsx`:

```tsx
import type { Unit } from '@/api/types'
import { Button } from '@/ui/button'
import { formatRupiah } from '@/lib/format'

export function UnitTable({ units, onUbahStatus, onHapus }: { units: Unit[]; onUbahStatus: (unit: Unit) => void; onHapus: (unit: Unit) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-brand-border bg-brand-surface">
      <table className="w-full min-w-[44rem] border-collapse text-ui">
        <thead className="bg-brand-surface-sunken text-micro uppercase tracking-label text-brand-text-muted">
          <tr>
            <th className="px-4 py-3 text-left">Nama unit</th>
            <th className="px-4 py-3 text-left">Lokasi</th>
            <th className="px-4 py-3 text-right">Harga / bulan</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => (
            <tr key={unit.id} className="border-t border-brand-border">
              <td className="px-4 py-3 font-semibold text-brand-text">{unit.name}</td>
              <td className="px-4 py-3 text-brand-text-muted">{unit.address}</td>
              <td className="px-4 py-3 text-right text-brand-text">{formatRupiah(unit.price)}</td>
              <td className="px-4 py-3">
                <span className={unit.status === 'Tersedia' ? 'rounded-full bg-brand-success-soft px-3 py-1 text-micro font-bold text-brand-success-soft-fg' : 'rounded-full bg-brand-danger-soft px-3 py-1 text-micro font-bold text-brand-danger-soft-fg'}>
                  {unit.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => onUbahStatus(unit)}>
                    Ubah status
                  </Button>
                  <Button variant="destructive" onClick={() => onHapus(unit)}>
                    Hapus
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

`src/features/units/components/delete-unit-dialog.tsx`:

```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/ui/alert-dialog'

export function DeleteUnitDialog({ open, nama, onBatal, onSetuju }: { open: boolean; nama: string; onBatal: () => void; onSetuju: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={(terbuka) => { if (!terbuka) onBatal() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus unit ini?</AlertDialogTitle>
          <AlertDialogDescription>Unit {nama} beserta kontrak dan tagihannya tidak dapat dikembalikan.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onSetuju}>Hapus unit</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

`src/features/units/pages/unit-list-page.tsx`:

```tsx
import { useState } from 'react'
import { Link } from 'react-router'
import type { Unit } from '@/api/types'
import { DeleteUnitDialog } from '@/features/units/components/delete-unit-dialog'
import { UnitTable } from '@/features/units/components/unit-table'
import { useDeleteUnit, useUnits, useUpdateUnit } from '@/features/units/api'
import { EmptyState } from '@/ui/empty-state'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'
import { useToast } from '@/ui/toast'
import { Button } from '@/ui/button'

function RangkaTabel() {
  return (
    <div className="space-y-2 rounded-xl border border-brand-border bg-brand-surface p-4">
      {[0, 1, 2, 3, 4].map((baris) => (
        <div key={baris} data-testid="baris-rangka">
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

export function UnitListPage() {
  const daftar = useUnits()
  const ubah = useUpdateUnit()
  const hapus = useDeleteUnit()
  const { tampilkan } = useToast()
  const [dihapus, setDihapus] = useState<Unit | null>(null)

  return (
    <section className="mx-auto max-w-container space-y-6 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-heading-m font-bold text-brand-text">Unit Saya</h2>
        <Button asChild={false} onClick={() => undefined}>
          <Link to="/pemilik/unit/baru">Tambah Unit Baru</Link>
        </Button>
      </div>

      {daftar.isPending && <RangkaTabel />}
      {daftar.isError && <ErrorState message={(daftar.error as Error).message} onRetry={() => daftar.refetch()} />}
      {daftar.isSuccess && daftar.data.length === 0 && (
        <EmptyState title="Belum ada unit" description="Tambahkan unit pertama Anda supaya bisa disewa." action={<Link className="font-semibold text-brand-accent" to="/pemilik/unit/baru">Tambah Unit Baru</Link>} />
      )}
      {daftar.isSuccess && daftar.data.length > 0 && (
        <UnitTable
          units={daftar.data}
          onUbahStatus={(unit) => {
            ubah.mutate(
              { id: unit.id, status: unit.status === 'Tersedia' ? 'Terisi' : 'Tersedia' },
              { onSuccess: () => tampilkan('Status unit diperbarui.', 'success') },
            )
          }}
          onHapus={(unit) => setDihapus(unit)}
        />
      )}

      <DeleteUnitDialog
        open={Boolean(dihapus)}
        nama={dihapus?.name ?? ''}
        onBatal={() => setDihapus(null)}
        onSetuju={() => {
          if (!dihapus) return
          hapus.mutate(dihapus.id, {
            onSuccess: () => { tampilkan('Unit dihapus.', 'success'); setDihapus(null) },
            onError: (galat) => tampilkan((galat as Error).message, 'danger'),
          })
        }}
      />
    </section>
  )
}
```

- [ ] **Step 4: Jalankan sampai lolos**

```bash
bun run test src/features/units
bun run check:styles
bun run typecheck
```

Expected: seluruh tes lolos termasuk batal-tidak-mengubah-apa-pun dan galat jaringan + coba ulang.

- [ ] **Step 5: Commit**

```bash
git add src/features/units
git commit -m "feat(units): daftar unit dengan ubah status dan hapus berkonfirmasi"
```

---

### Task 9: Halaman tambah unit

**Files:**
- Create: `src/features/units/__tests__/unit-form-page.test.tsx`
- Modify: `src/features/units/pages/unit-form-page.tsx` (ganti pengganti sementara dari Task 6)
- Modify: `src/app/router.tsx` (bila rute belum ada)

**Interfaces:**
- Consumes: `useCreateUnit` (Task 7), `unitFormSchema` (Task 7), `useToast` (Task 5), `ApiError` (Task 3).
- Produces: `UnitFormPage` (rute `/pemilik/unit/baru`) yang setelah berhasil kembali ke `/pemilik/unit`.

- [ ] **Step 1: Tulis tes formulir yang gagal**

`src/features/units/__tests__/unit-form-page.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { UnitFormPage } from '@/features/units/pages/unit-form-page'
import { writeSession } from '@/features/auth/session'
import { renderWithProviders } from '@/test/render'

function renderHalaman() {
  writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
  return renderWithProviders(
    <MemoryRouter initialEntries={['/pemilik/unit/baru']}>
      <Routes>
        <Route path="/pemilik/unit/baru" element={<UnitFormPage />} />
        <Route path="/pemilik/unit" element={<p>Daftar unit</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('UnitFormPage', () => {
  it('menampilkan galat di bawah bidang dan ringkasan saat nama kosong', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Harga per Bulan (Rp)'), '1200000')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Unit' }))
    expect(await screen.findByText(/Nama unit belum diisi/i)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/Ada isian yang perlu diperbaiki/i)
  })

  it('menyimpan sekali walau tombol ditekan dua kali cepat', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Nama / Judul Unit'), 'Kos Kamar 09')
    await userEvent.type(screen.getByLabelText('Lokasi Singkat'), 'Bandung')
    await userEvent.type(screen.getByLabelText('Harga per Bulan (Rp)'), '1200000')
    const tombol = screen.getByRole('button', { name: 'Simpan Unit' })
    await userEvent.dblClick(tombol)
    await waitFor(() => expect(screen.getByText('Daftar unit')).toBeInTheDocument())
  })

  it('menampilkan sebab dan coba ulang saat penyimpanan pertama gagal', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Nama / Judul Unit'), 'Kos Kamar 11')
    await userEvent.type(screen.getByLabelText('Lokasi Singkat'), 'Bandung')
    await userEvent.type(screen.getByLabelText('Harga per Bulan (Rp)'), '1500000')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Unit' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/koneksi terputus/i)
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Unit' }))
    await waitFor(() => expect(screen.getByText('Daftar unit')).toBeInTheDocument())
  })

  it('menolak harga nol dengan pesan yang menyebut jalan keluarnya', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Nama / Judul Unit'), 'Kos Kamar 12')
    await userEvent.type(screen.getByLabelText('Lokasi Singkat'), 'Bandung')
    await userEvent.type(screen.getByLabelText('Harga per Bulan (Rp)'), '0')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Unit' }))
    expect(await screen.findByText(/Harga harus lebih besar dari nol/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Jalankan untuk memastikan gagal**

```bash
bun run test src/features/units/__tests__/unit-form-page.test.tsx
```

Expected: gagal karena halaman belum ada.

- [ ] **Step 3: Tulis halamannya**

`src/features/units/pages/unit-form-page.tsx`:

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { useCreateUnit } from '@/features/units/api'
import { unitFormSchema, type UnitFormValues } from '@/features/units/schema'
import { useToast } from '@/ui/toast'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

/* Bidang didaftarkan satu per satu, bukan lewat peta, supaya jenis nilai tiap
   bidang tetap terbaca TypeScript: `price` angka, sisanya teks. */

export function UnitFormPage() {
  const simpan = useCreateUnit()
  const { tampilkan } = useToast()
  const navigate = useNavigate()
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: { name: '', address: '', price: 0, status: 'Tersedia' },
  })

  const onSubmit = form.handleSubmit((nilai) => {
    if (simpan.isPending) return
    simpan.mutate(nilai, {
      onSuccess: () => {
        tampilkan('Unit baru tersimpan dan langsung tayang.', 'success')
        navigate('/pemilik/unit')
      },
    })
  })

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-10">
      <Link to="/pemilik/unit" className="inline-flex items-center gap-2 text-ui font-semibold text-brand-text-muted">
        ← Kembali
      </Link>

      <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-xl border border-brand-border bg-brand-surface p-6 shadow-sm">
        <h2 className="border-b border-brand-border pb-3 text-heading-s font-bold text-brand-text">Tambah Unit Properti Baru</h2>

        {simpan.isError && (
          <p role="alert" className="rounded-md border border-brand-danger-border bg-brand-danger-soft p-3 text-ui text-brand-danger-soft-fg">
            {(simpan.error as Error).message}
          </p>
        )}

        {Object.keys(form.formState.errors).length > 0 && (
          <p role="alert" className="rounded-md bg-brand-surface-sunken p-3 text-ui text-brand-text-muted">
            Ada isian yang perlu diperbaiki: {Object.keys(form.formState.errors).join(', ')}.
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Nama / Judul Unit</Label>
          <Input id="name" aria-invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />
          {form.formState.errors.name && <p className="text-ui text-brand-danger">{form.formState.errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Lokasi Singkat</Label>
          <Input id="address" aria-invalid={Boolean(form.formState.errors.address)} {...form.register('address')} />
          {form.formState.errors.address && <p className="text-ui text-brand-danger">{form.formState.errors.address.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Harga per Bulan (Rp)</Label>
          <Input id="price" type="number" aria-invalid={Boolean(form.formState.errors.price)} {...form.register('price', { valueAsNumber: true })} />
          {form.formState.errors.price && <p className="text-ui text-brand-danger">{form.formState.errors.price.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={simpan.isPending}>
          {simpan.isPending ? 'Menyimpan…' : 'Simpan Unit'}
        </Button>
      </form>
    </section>
  )
}
```

Catatan penting saat mengerjakan: `valueAsNumber` pada `price` membuat nilai kosong menjadi `NaN`. Zod sudah menolaknya lewat `z.coerce.number`, tetapi pastikan pesan galat yang muncul adalah pesan Indonesia dari skema, bukan pesan bawaan zod.

- [ ] **Step 4: Jalankan sampai lolos**

```bash
bun run test src/features/units
bun run check:styles
```

Expected: seluruh tes lolos, termasuk satu-simpan-pada-dua-klik dan kegagalan pertama lalu berhasil.

- [ ] **Step 5: Commit**

```bash
git add src/features/units src/app/router.tsx
git commit -m "feat(units): halaman tambah unit dengan validasi dan jalur gagal"
```

---

### Task 10: Dashboard pemilik versi awal

**Files:**
- Create: `src/features/dashboard/components/owner-stats.tsx`, `src/features/dashboard/__tests__/owner-dashboard-page.test.tsx`
- Modify: `src/features/dashboard/pages/owner-dashboard-page.tsx` (ganti pengganti sementara dari Task 6)

**Interfaces:**
- Consumes: `useUnits` (Task 7), `EmptyState`/`Skeleton` (Task 5).
- Produces: `OwnerDashboardPage` (rute `/pemilik`) dan `hitungStatistik(units: Unit[]): { total: number; tersedia: number; terisi: number; okupansi: number }`.

- [ ] **Step 1: Tulis tes statistik yang gagal**

`src/features/dashboard/__tests__/owner-dashboard-page.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { hitungStatistik } from '@/features/dashboard/components/owner-stats'
import { OwnerDashboardPage } from '@/features/dashboard/pages/owner-dashboard-page'
import { writeSession } from '@/features/auth/session'
import { renderWithProviders } from '@/test/render'

describe('hitungStatistik', () => {
  it('menghitung total, tersedia, terisi, dan okupansi bulat', () => {
    expect(
      hitungStatistik([
        { id: 1, owner_id: 402, name: 'A', address: 'X', price: 100, status: 'Tersedia' },
        { id: 2, owner_id: 402, name: 'B', address: 'X', price: 100, status: 'Terisi' },
        { id: 3, owner_id: 402, name: 'C', address: 'X', price: 100, status: 'Terisi' },
      ]),
    ).toEqual({ total: 3, tersedia: 1, terisi: 2, okupansi: 67 })
  })

  it('aman untuk daftar kosong', () => {
    expect(hitungStatistik([])).toEqual({ total: 0, tersedia: 0, terisi: 0, okupansi: 0 })
  })
})

describe('OwnerDashboardPage', () => {
  it('menampilkan empat kartu angka dari unit pemilik yang masuk', async () => {
    writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
    renderWithProviders(
      <MemoryRouter>
        <OwnerDashboardPage />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText('Total Unit')).toBeInTheDocument())
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('67%')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Jalankan untuk memastikan gagal**

```bash
bun run test src/features/dashboard
```

Expected: gagal karena modul belum ada.

- [ ] **Step 3: Tulis komponen statistik dan halaman**

`src/features/dashboard/components/owner-stats.tsx`:

```tsx
import type { Unit } from '@/api/types'

export function hitungStatistik(units: Unit[]) {
  const total = units.length
  const tersedia = units.filter((unit) => unit.status === 'Tersedia').length
  const terisi = total - tersedia
  const okupansi = total === 0 ? 0 : Math.round((terisi / total) * 100)
  return { total, tersedia, terisi, okupansi }
}

export function OwnerStats({ units }: { units: Unit[] }) {
  const { total, tersedia, terisi, okupansi } = hitungStatistik(units)
  const kartu = [
    { label: 'Total Unit', nilai: String(total) },
    { label: 'Tersedia', nilai: String(tersedia) },
    { label: 'Terisi', nilai: String(terisi) },
    { label: 'Okupansi', nilai: `${okupansi}%` },
  ]

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {kartu.map(({ label, nilai }) => (
        <div key={label} className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm">
          <p className="text-label font-semibold uppercase tracking-label text-brand-text-muted">{label}</p>
          <p className="mt-1 text-heading-l font-bold text-brand-text">{nilai}</p>
        </div>
      ))}
    </div>
  )
}
```

`src/features/dashboard/pages/owner-dashboard-page.tsx`:

```tsx
import { Link } from 'react-router'
import { useUnits } from '@/features/units/api'
import { OwnerStats } from '@/features/dashboard/components/owner-stats'
import { ErrorState } from '@/ui/error-state'
import { Skeleton } from '@/ui/skeleton'

export function OwnerDashboardPage() {
  const daftar = useUnits()

  return (
    <section className="mx-auto max-w-container space-y-8 px-4 py-8">
      <div className="rounded-xl bg-brand-surface-inverse p-6 text-brand-text-inverse">
        <h2 className="text-heading-l font-bold">Selamat datang</h2>
        <p className="mt-1 text-ui">Kelola ketersediaan unit kos, kontrakan, dan ruang usaha Anda di satu tempat.</p>
        <Link to="/pemilik/unit/baru" className="mt-4 inline-block rounded-md bg-brand-accent px-4 py-2 text-ui font-bold text-brand-accent-fg">
          Tambah Unit Baru
        </Link>
      </div>

      {daftar.isPending && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>}
      {daftar.isError && <ErrorState message={(daftar.error as Error).message} onRetry={() => daftar.refetch()} />}
      {daftar.isSuccess && <OwnerStats units={daftar.data} />}
    </section>
  )
}
```

- [ ] **Step 4: Jalankan sampai lolos**

```bash
bun run test src/features/dashboard
bun run check:styles
```

Expected: tiga tes lolos.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard
git commit -m "feat(dashboard): empat kartu angka pemilik dari daftar unit"
```

---

### Task 11: Dokumentasi dan verifikasi akhir

**Files:**
- Create: `README.md` (ganti isi bawaan template)
- Modify: `docs/superpowers/specs/2026-10-09-frontend-shell-design.md` (bila ada keputusan yang bergeser saat pengerjaan)

- [ ] **Step 1: Tulis README**

Isi yang wajib ada: cara menjalankan (`bun install`, `VITE_API_MOCK=on bun run dev`), daftar perintah, akun demo beserta perannya, penjelasan dua variabel lingkungan, asal token desain beserta perintah penyelarasannya, dan catatan bahwa kontrak API berada di repo ini sampai backend menyediakan endpoint yang sama.

- [ ] **Step 2: Jalankan seluruh gerbang**

```bash
bun run typecheck && bun run lint && bun run test && bun run check:styles && bun run build
```

Expected: kelima perintah lolos tanpa galat.

- [ ] **Step 3: Jalankan daftar periksa black-box manual**

Jalankan `VITE_API_MOCK=on bun run dev` lalu periksa satu per satu, mencatat hasilnya untuk Lampiran 5: masuk dengan akun pemilik; muat ulang halaman dan sesi tetap ada; daftar unit menampilkan rangka bayangan lalu hanya unit milik pemilik; tambah unit dengan satu kegagalan pertama lalu berhasil; ubah status; hapus dengan batal lalu dengan setuju; tombol tema mengubah seluruh halaman; keluar mengembalikan ke layar masuk.

- [ ] **Step 4: Commit**

```bash
git add README.md docs
git commit -m "docs(readme): cara menjalankan mode mock, akun demo, dan asal token"
```

---

## Catatan penutup

- Semua task dikerjakan berurutan; tidak ada langkah yang mengandalkan task setelahnya.
- Halaman unit dan dashboard berdiri sebagai pengganti sementara di Task 6 supaya router bisa diuji, lalu digantikan utuh di Task 8, 9, dan 10. Jangan sisakan berkas pengganti.
- Skenario black-box manual di Task 11 adalah bahan Lampiran 5; catat tanggal, langkah, dan hasilnya saat mengerjakan, bukan disusun kemudian.
