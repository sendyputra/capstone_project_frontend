# Nusantara Booking — Frontend

Aplikasi React untuk Nusantara Booking (pengelolaan & sewa properti UMKM). Repo ini
terpisah dari backend Laravel dan berbicara lewat REST. Potongan ini berisi kerangka
aplikasi plus satu alur utuh: masuk → kelola unit pemilik.

## Menjalankan

```bash
bun install
VITE_API_MOCK=on bun run dev
```

Buka `http://localhost:5173/masuk`.

Tanpa `VITE_API_MOCK=on`, aplikasi akan memanggil API sungguhan di `VITE_API_BASE_URL`.

## Perintah

| Perintah | Kegunaan |
|---|---|
| `bun run dev` | Server pengembangan Vite |
| `bun run build` | `tsc -b` lalu `vite build` |
| `bun run lint` | oxlint |
| `bun run typecheck` | `tsc -b --noEmit` |
| `bun run test` | Vitest sekali jalan |
| `bun run test:watch` | Vitest mode pantau |
| `bun run tokens:sync` | Menyalin token desain dari repo naskah |
| `bun run check:styles` | Menolak kelas warna mentah di `src/` |

## Akun demo

Kata sandi apa pun diterima asalkan panjangnya minimal 8 karakter.

| Email | Peran |
|---|---|
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
`src/styles/tokens.css` dan `src/styles/assets/plus-jakarta-sans-latin.woff2` adalah
**salinan turunan** — jangan disunting di repo ini. Sunting berkas kanoniknya di
`opendesign/`, lalu jalankan:

```bash
bun run tokens:sync
```

Jalur repo naskah bisa ditimpa lewat variabel `CAPSTONE_NASKAH`. `src/styles/index.css`
memetakan token itu ke kelas utilitas Tailwind v4 dan ke nama variabel yang diharapkan
komponen shadcn. Pagar `bun run check:styles` menolak kelas warna mentah supaya aturan
tersebut tidak bisa dilanggar tanpa ketahuan.

## Kontrak API

Kontrak API potongan ini hidup di repo ini saja (belum disepakati dengan backend) dan
diperlakukan sebagai usulan yang bisa dibawa ke backend saat integrasi dimulai. Handler
MSW di `src/api/mocks/handlers/` dan klien bertipe di `src/api/client.ts` adalah bentuk
kontrak berjalan.

```
POST   /auth/login   { email, password }                 -> { token, user }
GET    /auth/me                                          -> { user }
GET    /units                                            -> { data: Unit[] }
POST   /units        { name, address, price, status }    -> { data: Unit }
GET    /units/:id                                        -> { data: Unit }
PATCH  /units/:id    { name?, address?, price?, status? } -> { data: Unit }
DELETE /units/:id                                        -> 204

User { id, name, email, role }   role: "penyewa" | "pemilik" | "admin"
Unit { id, owner_id, name, address, price, status }   status: "Tersedia" | "Terisi"
```

Nilai uang dikirim sebagai angka rupiah utuh; string desimal dari kolom `decimal(15,2)`
dinormalisasi di `src/lib/format.ts`.
