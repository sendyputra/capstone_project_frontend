# AGENTS.md

## Isi repo ini

Antarmuka Nusantara Booking: React 19 + Vite + TypeScript + Tailwind v4, satu potongan
tipis — beranda publik, masuk, dashboard pemilik, daftar dan tambah unit. Paket, perintah,
dan tata letak berkas sudah terbaca dari `package.json` dan pohon `src/`; berkas ini hanya
memuat yang tidak terbaca dari sana.

Repo ini frontend-nya (`origin` = `sendyputra/capstone_project_frontend`), tapi naskahnya
belum diperbarui: `notion/status-terbuka.md:40` masih mencatat repo frontend "Belum ada"
dan kartu Sprint 0 "Setup repo frontend" masih terbuka. Purwarupa di `opendesign/` repo
naskah hanyalah mockup tiga peran, bukan aplikasi ini.

Naskah proyek ada di repo tetangga `../capstone_project_6` (geser dengan `CAPSTONE_NASKAH`).
Naskah sumber kebenaran desain dan lingkup; repo ini mengikutinya.

## Panduan naskah: apa yang dibuka, kapan

Peta lengkap dokumen naskah ada di `../capstone_project_6/AGENTS.md`. Yang dipakai di sini:

| Berkas | Buka saat |
|---|---|
| `opendesign/DESIGN.md` | Menyentuh tampilan — warna, tipe, jarak, elevasi, aturan yang mudah dilanggar |
| `opendesign/prototype/index.html` | Membangun layar — purwarupa tiga peran: tata letak, isi, percabangan |
| `opendesign/tokens.css` | Butuh nilai token; kanoniknya di sini, yang di repo ini salinan |
| `notion/08c-desain-wireframe.md` | Menentukan layar mana yang ada dan mana yang bertanda belum diisi |
| `docs/superpowers/specs/2026-10-09-frontend-shell-design.md` | Meragukan lingkup atau aturan potongan ini; ia yang mengikat |
| `notion/09-teknis.md` | Butuh URL backend, rute, atau skema data |

Purwarupa `opendesign/prototype/index.html` sudah disalin utuh ke repo ini — layar
penyewa, pemilik, dan admin. Wireframe naskah masih menandai beberapa layar "belum
diisi"; tanda itu dari fase desain dan tidak lagi menggambarkan repo ini.

## Konvensi yang tidak terbaca dari berkas lain

- `src/styles/tokens.css` salinan turunan. Sunting kanoniknya di naskah, lalu
  `bun run tokens:sync` — skripnya menolak bila salinan menyimpang dari sumber.
- Warna hanya lewat token. `bun run check:styles` menolak kelas mentah seperti
  `bg-blue-600` atau `text-slate-500`. Token sah bila dipetakan di blok `@theme`
  `src/styles/index.css`; token baru berarti menambah pemetaan di sana lebih dulu, dan
  `bun run check:tokens` menjaga daftar pemetaan yang wajib ada.
- Seluruh permintaan lewat `src/api/client.ts` — ia pemilik auth header, pemetaan galat
  (`ApiError.kind`), dan aturan 401: sesi dibuang, layar masuk menjelaskan sebabnya.
  Endpoint baru: tambah handler di `src/api/mocks/handlers/` lebih dulu — itu pengganti
  API Laravel selama backend belum menyediakan rute yang sama — dengan galat 401/403/422
  yang benar.
- `src/features/auth/session.ts` sumber identitas sesi (kunci `nb.session`). `useSession`
  hanya memastikan token masih berlaku; ia tidak menimpa identitas.
- Rute dijaga `RequireRole`; `<html>` menerima `data-role` bernilai `renter`, `owner`,
  atau `admin` lewat `toDataRole` — purwarupa dan `tokens.css` mengenali ketiganya.
  `/`, `/katalog`, `/katalog/:id`, `/masuk`, `/daftar`, `/bantuan`, dan `/403` terbuka
  untuk pengunjung; yang menuntut akun hanya pengajuannya dan `/tagihan`.
- Tulis tes **merah** dulu, baru kode. Suite hijau adalah gerbangnya: `typecheck`, `lint`,
  `test`, `check:styles`, `check:tokens`, `build`. `renderWithProviders`
  (`src/test/render.tsx`) sudah membungkus QueryClient, ToastProvider, dan ConfirmProvider;
  `masukSebagai` (`src/test/sesi.ts`) menulis sesi uji ber-token asli — token palsu akan
  jatuh ke pemilik bawaan dan menyamarkan peran yang sedang diuji.

## Jebakan

- Lingkungan ini mengekspor `NODE_ENV=production`, yang memuat build React produksi tanpa
  `act`; `vitest.config.ts` memaku `env: { NODE_ENV: 'test' }`.
- MSW 3 memakai `onUnhandledFrame`, bukan `onUnhandledRequest`.
- TypeScript 6 menolak `baseUrl`; alias `@/*` cukup lewat `paths`.
- Skema `z.coerce.number()` membuat tipe input `unknown`; pakai
  `useForm<z.input<typeof skema>, unknown, z.output<typeof skema>>`.
