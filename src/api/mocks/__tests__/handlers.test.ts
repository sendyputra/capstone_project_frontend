import { afterEach, describe, expect, it } from 'vitest'
import { keDaftarKontrak } from '@/api/adapters/contracts'
import { keDaftarPembayaran } from '@/api/adapters/payments'
import { apiFetch } from '@/api/client'
import type { ContractDtoRow } from '@/api/mocks/handlers/contracts'
import type { PaymentDtoRow } from '@/api/mocks/handlers/payments'
import { aktifkanSimulasi } from '@/api/mocks/handlers/simulasi'
import type { UnitDtoRow } from '@/api/mocks/join'
import { susunTagihan } from '@/lib/tagihan'
import { writeSession, type Session } from '@/features/auth/session'
import type { User } from '@/api/types'

function sesi(id: number, role: Session['user']['role'], nama: string): Session {
  return { token: `mock.${btoa(JSON.stringify({ sub: id }))}.tanda`, user: { id, name: nama, email: 'x@mail.com', role } }
}

/* Dua peran saja sejak layar admin dihapus: sesi uji memakai pemilik, dan
   penyewa untuk layar yang memang dilihat penyewa (katalog, tagihan sendiri).
   `pemilikLain` ada supaya cakupan antar-pemilik bisa dibuktikan, bukan cuma
   diasumsikan dari satu sisi. */
const pemilik = sesi(402, 'pemilik', 'Pak Wahyu')
const pemilikLain = sesi(403, 'pemilik', 'Bu Rina')
const penyewa = sesi(405, 'penyewa', 'Siti Sarah')

afterEach(() => {
  localStorage.clear()
})

describe('data contoh', () => {
  it('menyajikan dua puluh empat unit dengan tipe, fasilitas, gambar, dan tanggal terisi', async () => {
    /* Katalog lintas pemilik dibaca sebagai penyewa: cakupan pemilik hanya
       unitnya sendiri, sedangkan katalog publik memuat seluruh unit. */
    writeSession(penyewa)
    const { data } = await apiFetch<{ data: UnitDtoRow[] }>('/units')
    expect(data).toHaveLength(24)
    /* Status dikirim sebagai enum backend; label `Tersedia` urusan adaptor. */
    expect(data[0]).toMatchObject({ name: 'Kos Kamar 01', type: 'Kamar Kos', status: 'available' })
    expect(data[0].facilities.length).toBeGreaterThan(0)
    expect(data[0].image).toMatch(/^\/demo\//)
    expect(data[0].booked_dates).toEqual([5, 6, 7, 12, 13, 20])
  })

  /* Jalur relatif, bukan `http://localhost/...` seperti di brief: MSW mencocokkan
     handler relatif pada asal dokumen jsdom, jadi URL mutlak dengan porta lain
     tidak pernah mencegat. Yang diuji tetap sama — bentuk jawaban mentah. */
  it('unit mock memakai enum backend', async () => {
    const res = await fetch('/units')
    const badan = (await res.json()) as { data: { status: string }[] }
    expect(['available', 'rented', 'maintenance']).toContain(badan.data[0].status)
  })

  it('menyajikan kontrak dan tagihan milik pemilik yang masuk, lengkap dengan hasil join', async () => {
    writeSession(pemilik)
    /* Angka di bawah diukur dari data contoh, bukan disalin dari purwarupa:
       unit 1, 2, 3, 6, 7, 8 milik 402 → kontrak 201, 203, 204, 205, 206, 222.
       Tagihan untuk 402: 303 (201), 359 (203), 305 (205), dan 308–312 (206). */
    const kontrak = (await apiFetch<{ data: ContractDtoRow[] }>('/contracts')).data
    expect(kontrak.map((baris) => baris.id)).toEqual([201, 203, 204, 205, 206, 222])
    expect(kontrak[0]).toMatchObject({
      renter_name: 'Siti Sarah',
      unit_title: 'Kontrakan Rumah Asri Type 36',
      owner_name: 'Pak Wahyu',
      status: 'active',
    })

    const tagihan = (await apiFetch<{ data: PaymentDtoRow[] }>('/payments')).data
    expect(tagihan.map((baris) => baris.id)).toEqual([303, 305, 308, 309, 310, 311, 312, 359])
    expect(tagihan[0]).toMatchObject({
      month: '2026-09',
      status: 'paid',
      renter_name: 'Siti Sarah',
      unit_title: 'Kontrakan Rumah Asri Type 36',
    })
  })

  it('membatasi GET /contracts pada unit milik pemilik yang meminta', async () => {
    writeSession(pemilik)
    const milikWahyu = (await apiFetch<{ data: ContractDtoRow[] }>('/contracts')).data
    expect(milikWahyu.map((baris) => baris.id)).toEqual([201, 203, 204, 205, 206, 222])
    expect(milikWahyu.some((baris) => baris.id === 202)).toBe(false)

    writeSession(pemilikLain)
    const milikRina = (await apiFetch<{ data: ContractDtoRow[] }>('/contracts')).data
    expect(milikRina.map((baris) => baris.id)).toEqual([202, 207, 215, 218, 219])
    expect(milikRina[0]).toMatchObject({ owner_name: 'Bu Rina', unit_title: 'Kontrakan Melati Type 45' })

    /* Penyewa juga dibatasi token: 405 → tenant 2, yaitu kontrak 201 dan 205.
       Tanpa ini, tagihan yang diturunkan dari kontrak memuat unit penyewa lain. */
    writeSession(penyewa)
    const milikSiti = (await apiFetch<{ data: ContractDtoRow[] }>('/contracts')).data
    expect(milikSiti.map((baris) => baris.id)).toEqual([201, 205])
    expect(milikSiti.every((baris) => baris.tenant_id === 2)).toBe(true)
  })

  it('mengirim seluruh unit ke penyewa dan hanya unit sendiri ke pemilik', async () => {
    writeSession(penyewa)
    const katalog = (await apiFetch<{ data: UnitDtoRow[] }>('/units')).data
    expect(katalog).toHaveLength(24)

    writeSession(pemilik)
    const milik = (await apiFetch<{ data: UnitDtoRow[] }>('/units')).data
    expect(milik).toHaveLength(6)
    expect(milik.every((unit) => unit.owner_id === 402)).toBe(true)
  })

  it('menukar status unit lewat PATCH /units/:id/status', async () => {
    writeSession(pemilik)
    await apiFetch('/units/1/status', { method: 'PATCH', body: { status: 'rented' } })
    const unit = (await apiFetch<{ data: UnitDtoRow }>('/units/1')).data
    expect(unit.status).toBe('rented')
  })

  it('mengubah status kontrak lewat PUT', async () => {
    writeSession(pemilik)
    await apiFetch('/contracts/205', { method: 'PUT', body: { status: 'active' } })
    const kontrak = (await apiFetch<{ data: ContractDtoRow[] }>('/contracts')).data.find((baris) => baris.id === 205)
    expect(kontrak?.status).toBe('active')
  })

  it('membuat kontrak: menolak isian yang kurang, lalu menyimpan baris ber-enum', async () => {
    writeSession(penyewa)
    await expect(apiFetch('/contracts', { method: 'POST', body: { unit_id: 1 } })).rejects.toMatchObject({
      kind: 'validation',
    })

    const { data } = await apiFetch<{ data: ContractDtoRow }>('/contracts', {
      method: 'POST',
      body: { unit_id: 1, start_date: '2026-12-01', end_date: '2027-03-01', total_price: 3600000 },
    })
    /* Penyewa diambil dari token (405 → tenant 2), status selalu `pending`. */
    expect(data).toMatchObject({
      id: 225,
      unit_id: 1,
      tenant_id: 2,
      status: 'pending',
      start_date: '2026-12-01',
      end_date: '2027-03-01',
      renter_name: 'Siti Sarah',
      unit_title: 'Kos Kamar 01',
      owner_name: 'Pak Wahyu',
    })
  })

  it('menerima dan menolak bukti bayar lewat PUT', async () => {
    /* Cakupan pemilik hanya tagihan unitnya sendiri. */
    writeSession(pemilik)
    await apiFetch('/payments/305', { method: 'PUT', body: { status: 'paid' } })
    await apiFetch('/payments/303', { method: 'PUT', body: { status: 'rejected' } })
    const tagihan = (await apiFetch<{ data: PaymentDtoRow[] }>('/payments')).data
    expect(tagihan.find((baris) => baris.id === 305)?.status).toBe('paid')
    expect(tagihan.find((baris) => baris.id === 303)).toMatchObject({ status: 'rejected', proof_url: '' })
  })

  /* Dua tes multipart di bawah mengirim badan yang disusun tangan, bukan
     `new FormData()`. Sebabnya lingkungan, bukan selera: jsdom menyediakan kelas
     `File`/`Blob` dari realm lain, sedangkan parser multipart yang dipakai MSW
     memeriksa merek kelas Node, sehingga `request.formData()` melempar
     `AssertionError`/`UND_ERR_REQ_CONTENT_LENGTH_MISMATCH` untuk bagian berkas
     apa pun. Badan multipart asli + kelas `node:buffer` selama permintaan
     menguji jalur yang sama: `request.formData()` di handler, bagian berkas
     berupa `File`, dan `proof_url` dari nama berkas. */
  it('pembayaran mock menerima multipart', async () => {
    const badan = multipart({ contract_id: '1', month: '2026-10', amount: '1500000' }, { nama: 'bukti.png', isi: 'x' })
    const res = await kirim('/payments', badan)
    expect(res.status).toBe(201)
    const jawaban = (await res.json()) as { data: { status: string; month: string; proof_url: string } }
    expect(jawaban.data).toMatchObject({ status: 'pending', month: '2026-10', proof_url: '/bukti/bukti.png' })
  })

  it('menolak multipart tanpa berkas bukti dengan 422', async () => {
    const badan = multipart({ contract_id: '202', month: '2026-10', amount: '3100000' })
    const res = await kirim('/payments', badan)
    expect(res.status).toBe(422)
    const jawaban = (await res.json()) as { errors: Record<string, string[]> }
    expect(jawaban.errors.proof).toHaveLength(1)
  })

  /* Id unggahan dihitung dari id tertinggi yang hidup, bukan `payments.length + 1`.
     Data contoh ber-id 302–360, jadi cara lama memberi baris baru id 59 dan
     `susunTagihan` — yang memakai baris ber-id terbesar per bulan — tetap
     menampilkan `Ditolak`: unggah ulang tampak tidak terjadi apa-apa. */
  it('unggah ulang bulan yang ditolak menurunkan baris Menunggu Verifikasi', async () => {
    writeSession(pemilik)
    /* Tolak bukti September kontrak 201 (baris 303), lalu unggah ulang bulan itu. */
    await apiFetch('/payments/303', { method: 'PUT', body: { status: 'rejected' } })

    const badan = multipart({ contract_id: '201', month: '2026-09', amount: '2500000' }, { nama: 'bukti-sep-ulang.jpg', isi: 'x' })
    const res = await kirim('/payments', badan)
    expect(res.status).toBe(201)
    const baru = ((await res.json()) as { data: { id: number } }).data
    expect(baru.id).toBeGreaterThan(305)

    /* Baris turunan yang dilihat penyewa di `/tagihan` dihitung dari kontrak dan
       pembayaran, jadi yang diperiksa adalah hasil `susunTagihan`, bukan jawaban
       POST-nya saja. */
    const tagihan = susunTagihan(
      keDaftarKontrak(await apiFetch<unknown>('/contracts')),
      keDaftarPembayaran(await apiFetch<unknown>('/payments')),
      '2026-09-15',
    )
    expect(tagihan.find((baris) => baris.contract_id === 201 && baris.month === '2026-09')).toMatchObject({
      status: 'Menunggu Verifikasi',
      proof_url: '/bukti/bukti-sep-ulang.jpg',
    })
  })

  it('unggah bukti bayar gagal sekali saat simulasi menyala', async () => {
    aktifkanSimulasi()
    const badan = multipart({ contract_id: '201', month: '2026-10', amount: '2500000' }, { nama: 'bukti-okt.jpg', isi: 'x' })
    expect((await kirim('/payments', badan)).status).toBe(500)
    const res = await kirim('/payments', badan)
    expect(res.status).toBe(201)
    expect(((await res.json()) as { data: { proof_url: string } }).data.proof_url).toBe('/bukti/bukti-okt.jpg')
  })

  it('mendaftarkan akun baru lewat multipart dan mengembalikan sesinya', async () => {
    /* Pendaftaran memakai `multipart/form-data` karena berkas KTP ikut terkirim;
       badan disusun tangan dengan alasan yang sama seperti dua tes di atas. */
    const badan = multipart(
      { name: 'Warga Baru', email: 'baru@mail.com', password: 'rahasia123', role: 'penyewa' },
      { nama: 'ktp.png', isi: 'x', bidang: 'ktp' },
    )
    const res = await kirim('/register', badan)
    expect(res.status).toBe(201)
    const hasil = (await res.json()) as { token: string; user: User }
    expect(hasil.token).toMatch(/^mock\./)
    expect(hasil.user.role).toBe('penyewa')
  })

  it('menolak pendaftaran multipart tanpa berkas KTP dengan 422', async () => {
    const badan = multipart({ name: 'Warga Baru', email: 'baru@mail.com', password: 'rahasia123' })
    const res = await kirim('/register', badan)
    expect(res.status).toBe(422)
    const jawaban = (await res.json()) as { errors: Record<string, string> }
    expect(jawaban.errors.ktp).toBe('Berkas KTP wajib diunggah.')
  })

  /* Akun baru harus langsung punya baris penyewa. Tanpa itu kontraknya jatuh ke
     `tenant_id: 0` dan layar pemilik menampilkan "Tanpa penyewa" / "Belum" untuk
     penyewa yang sah — ditemukan saat review Task 12. */
  it('membuat baris penyewa bersama akun baru, sehingga kontraknya bernama', async () => {
    const badan = multipart(
      { name: 'Warga Baru', email: 'baru2@mail.com', password: 'rahasia123', role: 'penyewa' },
      { nama: 'ktp.png', isi: 'x', bidang: 'ktp' },
    )
    const res = await kirim('/register', badan)
    expect(res.status).toBe(201)
    const hasil = (await res.json()) as { token: string; user: User }
    writeSession({ token: hasil.token, user: hasil.user })

    /* Diajukan sebagai akun baru itu sendiri: penyewa diambil dari token, bukan
       dari badan permintaan. */
    const { data } = await apiFetch<{ data: ContractDtoRow }>('/contracts', {
      method: 'POST',
      body: { unit_id: 1, start_date: '2027-01-01', end_date: '2027-04-01', total_price: 3600000 },
    })
    /* Yang gagal sebelum perbaikan: `renter_name` "Tanpa penyewa", `ktp`
       "Belum", dan `tenant_id` nol. */
    expect(data.renter_name).toBe('Warga Baru')
    expect(data.ktp).toBe('Menunggu')
    expect(data.tenant_id).toBeGreaterThan(0)
  })
})

type BadanMultipart = { tipe: string; isi: string }

/* Badan `multipart/form-data` asli: batas, bagian teks per bidang, satu bagian
   berkas opsional, lalu penutup. `fetch` menerima string dengan header batas
   yang sama persis, dan handler membacanya lewat `request.formData()`. Nama
   bidang berkas bisa dipilih karena pendaftaran memakai `ktp`, bukan `proof`. */
function multipart(
  bidang: Record<string, string>,
  berkas?: { nama: string; isi: string; bidang?: string },
): BadanMultipart {
  const batas = '----nusantara-booking'
  const baris = [
    ...Object.entries(bidang).flatMap(([nama, nilai]) => [`--${batas}`, `Content-Disposition: form-data; name="${nama}"`, '', nilai]),
    ...(berkas
      ? [
          `--${batas}`,
          `Content-Disposition: form-data; name="${berkas.bidang ?? 'proof'}"; filename="${berkas.nama}"`,
          'Content-Type: image/jpeg',
          '',
          berkas.isi,
        ]
      : []),
    `--${batas}--`,
    '',
  ]
  return { tipe: `multipart/form-data; boundary=${batas}`, isi: baris.join('\r\n') }
}

/* Parser multipart Node memeriksa merek kelas `File`/`Blob` miliknya sendiri,
   sedangkan jsdom memasang kelas dari realm lain. Selama satu permintaan, global
   ditukar ke kelas `node:buffer` lalu dikembalikan — tanpa ini, bagian berkas
   tidak pernah sampai ke handler di lingkungan uji.

   Spesifikasi modulnya ditulis lewat variabel karena tsconfig aplikasi sengaja
   tidak memuat tipe Node (kode `src/` berjalan di peramban); `node:buffer` hanya
   ada saat tes, di lingkungan Node. */
const modulBuffer = 'node:buffer'

async function kirim(jalur: string, badan: BadanMultipart): Promise<Response> {
  const { File: FileNode, Blob: BlobNode } = (await import(/* @vite-ignore */ modulBuffer)) as {
    File: typeof globalThis.File
    Blob: typeof globalThis.Blob
  }
  const asli = { File: globalThis.File, Blob: globalThis.Blob }
  globalThis.File = FileNode
  globalThis.Blob = BlobNode
  try {
    return await fetch(jalur, { method: 'POST', headers: { 'Content-Type': badan.tipe }, body: badan.isi })
  } finally {
    globalThis.File = asli.File
    globalThis.Blob = asli.Blob
  }
}
