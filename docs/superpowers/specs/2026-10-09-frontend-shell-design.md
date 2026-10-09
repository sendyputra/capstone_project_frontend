# Desain — Kerangka Frontend dan Potongan Pertama

Tanggal: 9 Oktober 2026
Repo: `capstone_project_frontend` (`sendyputra/capstone_project_frontend`)
Cakupan spec: kerangka aplikasi plus satu alur utuh (masuk → kelola unit pemilik). Potongan berikutnya mendapat spec sendiri.

Naskah, ERD, use case, wireframe, dan bahasa visual yang dirujuk di sini ada di repo
`capstone_project_6` (`notion/`, `opendesign/`). Aturan warna, tipe, jarak, radius, elevasi,
dan komponen didefinisikan di `opendesign/DESIGN.md` dan tidak diulang di sini.

## 1. Tujuan

Aplikasi React untuk Nusantara Booking, terpisah dari backend Laravel dan berbicara lewat REST.
Potongan pertama harus menghasilkan kerangka yang bisa menampung delapan fitur wajib tanpa
dibongkar ulang, plus satu alur yang benar-benar jalan sebagai bukti: pemilik masuk, lalu
mengelola unitnya.

Kriteria sukses potongan ini:

- Satu alur utuh berjalan di browser: masuk → daftar unit → tambah unit → ubah status → hapus.
- Semua keadaan layar baku sudah ada dan bisa didemokan tanpa backend (memuat, kosong, galat, coba ulang).
- Tidak ada nilai warna mentah di `src/`; seluruh tampilan berasal dari token.
- `typecheck`, `lint`, `test`, dan `build` lolos.
- Berpindah ke API asli cukup dengan mengubah dua variabel lingkungan.

## 2. Keputusan yang sudah disetujui

| Keputusan | Pilihan |
|---|---|
| Kesiapan API | Backend belum bisa dipakai; frontend berjalan di atas mock |
| Potongan pertama | Kerangka + satu alur utuh (masuk → kelola unit pemilik) |
| Pengujian | Vitest + React Testing Library; skenario black-box tetap manual |
| Rangka teknis | React Router (data router), TanStack Query, MSW, Tailwind v4 + shadcn, react-hook-form + zod |
| Kontrak API | Hidup di repo frontend saja; halaman Routes dan Controller di naskah tetap milik Rahadian |

## 3. Ruang lingkup

**Termasuk:** kerangka routing dan tata letak per peran, autentikasi tiruan beserta penjaga rute,
klien HTTP, lapisan mock MSW, pipa token desain, komponen keadaan layar baku, fitur `auth` dan
`units`, serta pengujian untuk semuanya.

**Tidak termasuk di potongan ini:** pendaftaran dan OCR KTP, katalog penyewa dan pengajuan sewa,
tagihan dan unggah bukti, kalender ketersediaan, chart dashboard, seluruh layar admin, ekspor CSV,
pengingat jatuh tempo, integrasi API asli, dan pemilihan penyedia hosting.

## 4. Struktur modul

```
src/
  app/
    router.tsx            daftar rute dan penjaga peran
    providers.tsx         QueryClientProvider dan penyalaan worker mock
    layouts/              tata letak per peran (bilah atas, wadah isi)
  features/
    auth/                 api.ts, schema.ts, session.ts, components/, pages/
    units/                api.ts, schema.ts, components/, pages/
    contracts/            (belum diisi di potongan ini)
    payments/             (belum diisi)
    users/                (belum diisi)
    dashboard/            (belum diisi)
    calendar/             (belum diisi)
  api/
    client.ts             fetch tunggal: alamat dasar, token, terjemahan galat
    types.ts              tipe bersama kontrak: Paged, ApiError, dsb.
    mocks/
      browser.ts          setupWorker untuk peramban
      server.ts           setupServer untuk pengujian
      handlers/           handler per resource
      data/               data contoh yang sama dengan purwarupa
  ui/                     komponen shadcn yang sudah di-theme + komponen lokal
  lib/                    format.ts (rupiah, tanggal), schema bersama, cn.ts
  styles/
    index.css             @import tailwindcss + tokens + @theme
    tokens.css            salinan turunan dari opendesign/tokens.css
```

Aturan ketergantungan:

- `app/` hanya mengkabel: tidak berisi logika fitur.
- Fitur tidak mengimpor bagian dalam fitur lain. Yang dipakai bersama naik ke `lib/` atau `ui/`.
- Komponen tidak pernah memanggil `fetch` sendiri; akses data lewat hook di `features/*/api.ts`.
- `api/mocks/` boleh mengimpor tipe dari `api/types.ts`, tidak sebaliknya.

## 5. Alur data dan klien HTTP

- Satu klien di `api/client.ts`, dibungkus `fetch`. Tanggung jawabnya: menyusun alamat dari
  `VITE_API_BASE_URL`, menyisipkan `Authorization: Bearer <token>`, mengurai JSON, dan
  menerjemahkan galat menjadi satu bentuk `ApiError` bertipe:
  - `unauthorized` (401) — sesi dibuang, pengguna diarahkan ke `/masuk`.
  - `validation` (422) — memuat peta `field -> pesan`, dipakai react-hook-form.
  - `not_found` (404), `conflict` (409) — pesan langsung dari server.
  - `server` (5xx) — pesan umum Indonesia dan penanda bahwa aksi bisa diulang.
- Sesi disimpan di `localStorage` dengan kunci `nb.session` berisi `{ token, user }`. Token tiruan
  berbentuk `mock.<payload-base64>.<tanda>`; bentuknya sengaja menyerupai JWT supaya penggantian ke
  token asli tidak mengubah kode pemanggil. Modul `features/auth/session.ts` adalah satu-satunya
  tempat yang membaca dan menulis kunci itu.
- Saat aplikasi dibuka dan `nb.session` ada, aplikasi memanggil `GET /auth/me` untuk memastikan
  tokennya masih berlaku. Selama panggilan itu berjalan, rute menampilkan keadaan memuat; jawaban 401
  membuang sesi dan mengarahkan ke `/masuk`. Tanpa langkah ini, halaman yang dimuat ulang akan
  menampilkan isi sebelum tahu sesinya sah atau tidak.
- Query: setiap resource punya kunci query sendiri (`['units', { userId }]`, `['unit', id]`), dan
  `userId` diambil dari sesi supaya cache tidak bocor antar akun. Mutasi memakai invalidasi kunci,
  bukan penulisan cache manual. `staleTime` bawaan 30 detik; `retry` hanya untuk galat jaringan,
  maksimum sekali.
- Variabel lingkungan: `VITE_API_BASE_URL` dan `VITE_API_MOCK` (`on`/`off`). Contohnya dicatat di
  `.env.example` yang ikut di-commit; nilai lokal masuk `.env.local` yang sudah diabaikan oleh
  aturan `*.local` di `.gitignore`.

## 6. Batas mock

- MSW menangkap permintaan di level jaringan. Worker dinyalakan di `app/providers.tsx` hanya bila
  `VITE_API_MOCK=on`, sehingga kode fitur tidak pernah tahu apakah di baliknya ada backend.
- Penyalaan worker ditunggu sebelum pohon rute dirender. Tanpa itu, permintaan pertama — tepatnya
  `GET /auth/me` saat aplikasi dibuka — bisa lolos ke jaringan sungguhan dan gagal.
- Handler tinggal di `api/mocks/handlers/`, datanya di `api/mocks/data/` dengan bentuk yang sama
  seperti purwarupa: 5 unit, 4 kontrak, 4 pembayaran, 5 akun. Tiga di antaranya akun demo:
  `admin@nusantarabooking.id`, `wahyu@umkm.id`, `rian@mail.com`; kata sandi apa pun dengan panjang
  minimal 8 karakter diterima, dan peran diambil dari data akun.
- Jalan gagal disimulasikan seperti purwarupa: satu kegagalan pertama per aksi yang ditandai, lalu
  berhasil saat diulang. Aksi yang ditandai kegagalan di potongan ini adalah menyimpan unit dan
  menghapus unit.
- Handler yang sama dipakai `api/mocks/server.ts` di dalam tes, jadi tidak ada tiruan kedua.
- Berpindah ke API asli: matikan `VITE_API_MOCK`, isi `VITE_API_BASE_URL`. Tidak ada berkas fitur
  yang disentuh. Handler boleh ditinggalkan sebagai alat demo.

## 7. Kontrak API potongan pertama

Bentuk mengikuti ERD di `notion/08a-desain-erd.md`; nama field memakai penamaan kolom di sana.
Kontrak ini hidup di repo ini saja dan belum disepakati dengan backend, jadi diperlakukan sebagai
usulan yang bisa dibawa ke Rahadian.

```
POST   /auth/login        { email, password }        -> { token, user }
GET    /auth/me                                      -> { user }
GET    /units            -> { data: Unit[] }   milik pemanggil; admin boleh menyaring ?owner_id=
POST   /units             { name, address, price, status } -> { data: Unit }
GET    /units/:id                                    -> { data: Unit }
PATCH  /units/:id         { name?, address?, price?, status? } -> { data: Unit }
DELETE /units/:id                                    -> 204

User   { id, name, email, role }            role: "penyewa" | "pemilik" | "admin"
Unit   { id, owner_id, name, address, price, status }
                                            status: "Tersedia" | "Terisi"
```

Catatan yang sudah disepakati naskah dan dipatuhi di sini: nilai uang dikirim sebagai angka rupiah
utuh (tanpa desimal) dan diformat di layar; `price` di ERD bertipe `decimal(15,2)`, jadi serialisasi
desimal dari backend harus dinormalisasi di satu tempat (`lib/format.ts`).

`GET /units` sengaja tidak menerima parameter penyaring untuk pemilik: backend yang menentukan
cakupannya dari token, sehingga frontend tidak perlu mengirim `owner_id` sendiri dan tidak bisa
salah menyaring. Penyaringan lintas pemilik baru dipakai admin di potongan berikutnya.

## 8. Pipa token desain

- `opendesign/tokens.css` di repo naskah adalah kanonik. Repo ini menyimpan salinannya di
  `src/styles/tokens.css` supaya build tidak bergantung pada repo lain, dengan catatan di kepala
  berkas bahwa isinya turunan dan tidak disunting di sini.
- `bun run tokens:sync` menyalin berkas itu dari repo naskah dan gagal bila salinan tidak identik
  setelah disalin. Jalur repo naskah bisa ditimpa lewat variabel `CAPSTONE_NASKAH`.
- `src/styles/index.css`: `@import "tailwindcss"` → `@import "./tokens.css"` → blok `@theme` yang
  memetakan token ke nama utilitas, misalnya `--color-surface`, `--color-accent`, `--color-owner`,
  `--radius-card`, `--shadow-card`. Kode aplikasi memakai nama itu (`bg-surface`, `text-muted`,
  `rounded-card`), bukan nilai mentah.
- Komponen shadcn disalin ke `src/ui/` lalu variabelnya diarahkan ke token kita (`--primary`,
  `--border`, `--radius`) supaya tidak ada tema bawaan shadcn yang tersisa.
- Ikon memakai Font Awesome (`@fortawesome/react-fontawesome` + `free-solid` + `free-brands`) agar
  sama dengan purwarupa, termasuk merek Instagram dan WhatsApp yang tetap memakai warnanya sendiri
  di dalam chipnya.
- Tema: `data-theme` dan `data-role` dipasang pada elemen `<html>`. Tema gelap dan aksen peran
  (penyewa biru, pemilik teal) berasal dari token yang sama; tombol tema ada di bilah atas.
- Pagar `bun run check:styles` menolak kelas warna mentah (`bg-red-500`, `text-slate-700`, dan
  sejenisnya) di `src/`, supaya aturan DESIGN.md tidak bisa dilanggar tanpa ketahuan.

## 9. Rute dan penjaga peran

| Rute | Peran | Isi |
|---|---|---|
| `/masuk` | publik | Formulir masuk, akun demo disebut di bawah formulir |
| `/daftar` | publik | Belum diisi di potongan ini |
| `/` | penyewa | Beranda katalog, belum diisi |
| `/unit/:id` | penyewa | Detail unit, belum diisi |
| `/tagihan` | penyewa | Belum diisi |
| `/pemilik` | pemilik | Dashboard pemilik, versi awal: sapaan, tombol `Tambah Unit Baru`, dan empat kartu angka yang semuanya bisa dihitung dari daftar unit — total unit, tersedia, terisi, dan persentase okupansi |
| `/pemilik/unit` | pemilik | Tabel unit milik pemilik yang sedang masuk |
| `/pemilik/unit/baru` | pemilik | Formulir tambah unit |
| `/pemilik/unit/:unitId/kalender` | pemilik | Belum diisi |
| `/pemilik/pengajuan` | pemilik | Belum diisi |
| `/admin/unit`, `/admin/kontrak`, `/admin/pembayaran`, `/admin/pengguna` | admin | Belum diisi |
| `/403` | semua | Peran tidak cocok |

- Tanpa sesi → `/masuk`. Peran tidak cocok → `/403`, tidak dialihkan diam-diam.
- Layar berdiri sendiri, bukan jendela sembul: tambah unit adalah halaman dengan jalan kembali yang
  memulihkan posisi gulir, sejalan dengan DESIGN.md. Yang tetap dialog hanya konfirmasi tindakan
  merusak (hapus unit), lengkap dengan tombol Escape dan klik di luar.
- Judul halaman mengikuti pola purwarupa: H2 untuk judul bagian, H3 untuk judul kartu dan formulir.

## 10. Keadaan layar baku

Dibuat sekali di `ui/` lalu dipakai semua fitur:

| Keadaan | Perilaku |
|---|---|
| Memuat | Rangka bayangan berbentuk teks, judul, dan baris tabel — bukan layar kosong, bukan pemintal |
| Kosong | Panel berikon, satu judul, satu kalimat penjelas, dan satu aksi utama |
| Galat | Kotak bersebab dan bersaran, plus tombol coba ulang bila aksinya bisa diulang |
| Galat isian | Pesan di bawah bidang, tepi bahaya, dan ringkasan di atas formulir panjang yang menautkan ke bidang bermasalah |
| Lambat | Tombol utama menampilkan keadaan sibuk dan tidak bisa ditekan dua kali |
| Hasil aksi | Toast: berhasil, gagal, dan info, menutup sendiri |

Semua keadaan di atas sudah dipraktikkan di purwarupa, jadi bentuknya sudah ada acuannya.

## 11. Pengujian

- Alat: Vitest + React Testing Library + jsdom, handler MSW yang sama dengan pengembangan.
- Diuji di potongan ini:
  - klien HTTP: menyisipkan token, memetakan 401/422/5xx menjadi jenis galat yang benar;
  - skema zod unit: `name` dan `address` wajib, `price` angka lebih besar dari nol, `status` hanya
    `Tersedia` atau `Terisi`;
  - pemformat rupiah dan tanggal;
  - penjaga rute: tanpa sesi diarahkan ke `/masuk`, peran salah ke `/403`;
  - alur kelola unit: daftar memuat rangka bayangan lalu data, tambah unit dengan satu kali validasi
    gagal lalu berhasil, ubah status menginvalidasi daftar, hapus menunggu konfirmasi dan batal tidak
    mengubah apa pun.
- Skenario black-box tetap dicatat manual dari browser mengikuti naskah Pengujian dan Evaluasi;
  hasilnya jadi bahan Lampiran 5. Playwright tidak dipakai di potongan ini.

## 12. Konvensi

- Penanda Inggris di kode (`unit`, `contract`), teks Indonesia di antarmuka memakai kosakata ranah
  terkunci: Kos, Kontrakan, Ruang Usaha, Apartemen, Tersedia, Terisi, Siap Huni, Penyewa, Pemilik,
  Pengajuan Sewa.
- Nama berkas `kebab-case`, komponen `PascalCase`. Hook query dan mutasi tinggal di
  `features/<fitur>/api.ts`; hook yang berdiri sendiri diberi berkas `use-*.ts` (misalnya
  `lib/use-theme.ts`). Komentar dan pesan commit bahasa Indonesia seperti repo naskah; commit memakai
  bentuk `tipe(lingkup): ringkasan`.
- `any` hanya dengan alasan tertulis di komentar.
- Kerja langsung di `main` dengan commit kecil; repo ini solo dan belum perlu cabang per potongan.
- Perintah: `bun run dev`, `build` (tsc + vite), `lint` (oxlint), `typecheck`, `test`,
  `test:watch`, `tokens:sync`, `check:styles`.

## 13. Definisi selesai potongan pertama

1. `bun run typecheck`, `bun run lint`, `bun run test`, dan `bun run build` lolos.
2. Masuk dengan akun demo pemilik mendarat di `/pemilik`; sesi bertahan setelah halaman dimuat
   ulang; keluar mengembalikan ke `/masuk`.
3. `/pemilik/unit` menampilkan rangka bayangan lalu hanya unit milik pemilik yang masuk.
4. Tambah unit: validasi tampil di bawah bidang dan di ringkasan; berhasil menyimpan membawa kembali
   ke daftar dengan baris baru dan toast berhasil.
5. Ubah status unit tersimpan dan daftar ikut diperbarui.
6. Hapus unit menunggu konfirmasi; batal tidak mengubah apa pun; setuju menghapus barisnya.
7. Kegagalan pertama saat menyimpan dan menghapus muncul dengan sebab serta tombol coba ulang, lalu
   berhasil saat diulang.
8. Tema gelap dan aksen pemilik berlaku lewat `data-theme` dan `data-role`.
9. `bun run check:styles` lolos: tidak ada kelas warna mentah di `src/`.
10. README repo menjelaskan cara menjalankan mode mock dan akun demo.

## 14. Risiko dan hal terbuka

| Hal | Dampak | Rencana |
|---|---|---|
| Kontrak hidup hanya di repo ini | Backend bisa melenceng dari bentuk yang dipakai frontend | Handler MSW dan klien bertipe diperlakukan sebagai kontrak berjalan; ditunjukkan ke Rahadian saat integrasi dimulai |
| ERD tidak punya `type`, `facilities`, `image` pada unit, sedangkan wireframe memakainya untuk filter katalog | Filter "Tipe Properti" dan fasilitas tidak punya kolom | Diputuskan sebelum potongan katalog: menambah kolom di ERD, atau menghapus filternya dari wireframe |
| Penyedia hosting belum dipilih | Alamat dasar dan `base` router bisa berubah saat deploy statis | Build memakai `base: '/'`; bila nanti diarahkan ke sub-path, cukup satu perubahan di `vite.config.ts` |
| `Payment.month` bertipe `YYYY-MM` dan `role` bertipe huruf kecil, sedangkan antarmuka memakai kata Indonesia | Pemetaan tersebar | Pemetaan ditaruh di satu modul `lib/format.ts` dan `features/auth/roles.ts` |
| Tanggal naskah masih tertulis 8 Oktober sementara pekerjaan berjalan 9 Oktober | Selisih tanggal di laporan | Dirapikan di repo naskah sebelum Tugas 2 |
