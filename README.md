# Nusantara Booking — Frontend

Aplikasi React untuk Nusantara Booking (pengelolaan & sewa properti UMKM). Repo ini
terpisah dari backend Laravel dan berbicara lewat REST. Isinya kini mengikuti purwarupa
naskah secara utuh: beranda publik, dan tiga peran — penyewa, pemilik, admin.

## Menjalankan

```bash
bun install
VITE_API_MOCK=on bun run dev
```

Buka `http://localhost:5173/`. Bilah **Pratinjau** di bawah layar masuk otomatis sebagai
akun contoh tiap peran (hanya muncul saat `VITE_API_MOCK=on`).

Tanpa `VITE_API_MOCK=on`, aplikasi akan memanggil API sungguhan di `VITE_API_BASE_URL`.

## Peta layar

| Rute | Peran | Isi |
|---|---|---|
| `/` | publik | Beranda publik (hero) |
| `/masuk`, `/daftar` | publik | Masuk dan pendaftaran (blok OCR KTP) |
| `/bantuan` | publik | Kanal Instagram dan WhatsApp |
| `/403` | publik | Peran tidak cocok |
| `/katalog`, `/katalog/:id` | penyewa | Katalog berfilter, detail unit + kalender, pengajuan sewa |
| `/tagihan` | penyewa | Tagihan bulanan dan unggah bukti bayar |
| `/pemilik` | pemilik | Dashboard: 4 angka termasuk estimasi pendapatan |
| `/pemilik/unit`, `/pemilik/unit/baru`, `/pemilik/unit/:id` | pemilik | Kelola unit, tambah unit, kalender unit |
| `/pemilik/pengajuan` | pemilik | Pengajuan sewa masuk |
| `/admin/unit` | admin | Unit lintas pemilik |
| `/admin/kontrak` | admin | Kontrak sewa |
| `/admin/pembayaran` | admin | Verifikasi bukti bayar |
| `/admin/pengguna` | admin | Akun, peran, penghapusan |

## Perintah

| Perintah | Kegunaan |
|---|---|
| `bun run dev` | Server pengembangan Vite |
| `bun run build` | `tsc -b` lalu `vite build` |
| `bun run lint` | oxlint |
| `bun run typecheck` | `tsc -b --noEmit` |
| `bun run test` | Vitest sekali jalan |
| `bun run test:watch` | Vitest mode pantau |
| `bun run tokens:sync` | Menyalin token dan gambar dari repo naskah |
| `bun run check:styles` | Menolak kelas warna mentah di `src/` |
| `bun run check:tokens` | Menolak pemetaan token yang kurang di `src/styles/index.css` |

Gerbangnya: `typecheck`, `lint`, `test`, `check:styles`, `check:tokens`, `build`.

## Akun demo

Kata sandi apa pun diterima asalkan panjangnya minimal 8 karakter.

| Email | Peran |
|---|---|
| `rian@mail.com` | Penyewa |
| `wahyu@umkm.id` | Pemilik |
| `rina@umkm.id` | Pemilik |
| `admin@nusantarabooking.id` | Admin |

## Variabel lingkungan

Disalin dari `.env.example` ke `.env.local` bila perlu.

| Variabel | Isi |
|---|---|
| `VITE_API_BASE_URL` | Alamat API Laravel. Kosongkan untuk memakai jalur relatif. |
| `VITE_API_MOCK` | `on` = data contoh lewat MSW; `off` = memanggil API sungguhan. |

Berpindah ke API asli cukup dengan mematikan `VITE_API_MOCK` dan mengisi
`VITE_API_BASE_URL`; tidak ada berkas fitur yang perlu disentuh. Handler mock boleh
ditinggalkan sebagai alat demo.

## Token desain

Bahasa visual berasal dari repo naskah (`capstone_project_6/opendesign`). Berkas
`src/styles/tokens.css`, font, dan gambar `public/demo/` adalah **salinan turunan** —
jangan disunting di repo ini. Sunting berkas kanoniknya di `opendesign/`, lalu jalankan:

```bash
bun run tokens:sync
```

Jalur repo naskah bisa ditimpa lewat variabel `CAPSTONE_NASKAH`. `src/styles/index.css`
memetakan token itu ke kelas utilitas Tailwind v4 dan ke nama variabel yang diharapkan
komponen shadcn. Pagar `check:styles` menolak kelas warna mentah, dan `check:tokens`
menolak pemetaan yang hilang, supaya aturan itu tidak bisa dilanggar tanpa ketahuan.

## Kontrak API

Kontrak API potongan ini hidup di repo ini saja (belum disepakati dengan backend) dan
diperlakukan sebagai usulan yang bisa dibawa ke backend saat integrasi dimulai. Bentuk
field mengikuti ERD naskah (`notion/08a-desain-erd.md`); handler MSW di
`src/api/mocks/handlers/` melakukan join seperti API sungguhan, jadi komponen menerima
baris siap tampil.

```
POST   /auth/login     { email, password }                 -> { token, user }
POST   /auth/register  { email, password }                 -> { token, user }
GET    /auth/me                                            -> { user }
GET    /units                                              -> { data: UnitRow[] }   (cakupan dari peran token)
GET    /units/:id                                          -> { data: UnitRow }
POST   /units          { name, address, price, status, type?, facilities? } -> { data: UnitRow }
PATCH  /units/:id      { ... }                             -> { data: UnitRow }
PATCH  /units/:id/status { status }                        -> { data: UnitRow }
DELETE /units/:id                                          -> 204
GET    /bookings                                           -> { data: BookingRow[] }
POST   /bookings       { unit_id }                         -> { data: BookingRow }
PATCH  /bookings/:id   { status }                          -> { data: BookingRow }
GET    /contracts      / PATCH /contracts/:id { status }    -> { data: ContractRow }
GET    /payments       / PATCH /payments/:id { status }     -> { data: PaymentRow }
POST   /payments/:id/proof { proof_url }                    -> { data: PaymentRow }
GET    /users          / PATCH /users/:id { role }          -> { data: User }
DELETE /users/:id      -> 204 (409 bila akun sendiri)

User { id, name, email, role, phone, city, joined }         role: "penyewa" | "pemilik" | "admin"
Unit { id, owner_id, name, address, price, status, type, facilities[], image, booked_dates[] }
Booking { id, unit_id, tenant_id, duration, status }
Contract { id, unit_id, tenant_id, start_date, end_date, total_price, status }
Payment { id, contract_id, month, amount, status, proof_url }
```

Beberapa aksi disimulasikan **gagal sekali** seperti purwarupa: simpan unit, hapus unit,
kirim pengajuan sewa, unggah bukti bayar. Simulasi mati saat tes, dan menyala bersama
worker mock di peramban.

Nilai uang dikirim sebagai angka rupiah utuh; string desimal dari kolom `decimal(15,2)`
dinormalisasi di `src/lib/format.ts`.
