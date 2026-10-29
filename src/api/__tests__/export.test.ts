import { describe, expect, it } from 'vitest'
import { payments } from '@/api/mocks/data/payments'
import { users } from '@/api/mocks/data/users'
import { masukSebagai } from '@/test/sesi'

async function minta(path: string, id: number, peran: 'penyewa' | 'pemilik', nama: string) {
  const sesi = masukSebagai(id, peran, nama)
  return fetch(path, { headers: { Authorization: `Bearer ${sesi.token}` } })
}

/* `Response.text()` membuang BOM sesuai aturan dekode UTF-8 peramban, padahal
   berkas unduhan membawa BOM dari byte-nya. Dekode ulang dari byte dengan
   `ignoreBOM` menjaga BOM tetap terbaca dan ikut diuji. */
async function bacaCsv(respons: Response) {
  const bytes = new Uint8Array(await respons.arrayBuffer())
  return new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes)
}

describe('handler export', () => {
  it('laporan tagihan penyewa berbentuk CSV', async () => {
    const respons = await minta('/payments/export', 405, 'penyewa', 'Siti Sarah')

    expect(respons.headers.get('content-type')).toContain('text/csv')
    /* Laravel `streamDownload` mengirim nama berkas tanpa kutip selama isinya
       ASCII biasa; mock harus menirunya supaya unduhan di dev sama bentuknya. */
    expect(respons.headers.get('content-disposition')).toMatch(/^attachment; filename=laporan-tagihan-\d{8}\.csv$/)

    const isi = await bacaCsv(respons)

    expect(isi.split('\r\n')[0]).toBe('\uFEFFBulan;Unit;Pemilik;Jumlah;Status;Bukti;Diunggah')
    expect(isi).toContain(
      '2026-09;Kontrakan Rumah Asri Type 36;Pak Wahyu;2500000;Lunas;bukti-transfer-201-sep.jpg;2026-09-01 00:00',
    )
    expect(isi).toContain(';Belum Bayar;;')
  })

  it('waktu unggah diambil dari pembayaran ber-id terbesar', async () => {
    payments.push({
      id: 400,
      contract_id: 201,
      month: '2026-09',
      amount: 2500000,
      status: 'paid',
      proof_url: 'bukti-transfer-201-sep-ulang.jpg',
      created_at: '2026-09-04 10:30',
    })

    const isi = await bacaCsv(await minta('/payments/export', 405, 'penyewa', 'Siti Sarah'))

    expect(isi).toContain(
      '2026-09;Kontrakan Rumah Asri Type 36;Pak Wahyu;2500000;Lunas;bukti-transfer-201-sep-ulang.jpg;2026-09-04 10:30',
    )
  })

  it('laporan tagihan pemilik memakai kolom Penyewa', async () => {
    const respons = await minta('/payments/export', 402, 'pemilik', 'Pak Wahyu')
    const isi = await bacaCsv(respons)

    expect(isi.split('\r\n')[0]).toBe('\uFEFFBulan;Unit;Penyewa;Jumlah;Status;Bukti;Diunggah')
    expect(isi).not.toContain('Kontrakan Melati Type 45')
  })

  it('laporan kontrak memuat semua status tanpa kolom KTP', async () => {
    const respons = await minta('/contracts/export', 402, 'pemilik', 'Pak Wahyu')
    const isi = await bacaCsv(respons)

    expect(isi.split('\r\n')[0]).toBe(
      '\uFEFFID;Penyewa;Unit;Pemilik;Mulai;Selesai;Durasi;Harga per Bulan;Nilai Kontrak;Status',
    )
    expect(isi).toContain(';Menunggu')
    expect(isi).toContain(';Aktif')
    expect(isi).not.toContain('KTP')
  })

  it('penyewa tanpa profil mendapat 404 json', async () => {
    users.push({
      id: 500,
      name: 'Penyewa Baru',
      email: 'baru@mail.com',
      role: 'penyewa',
      phone: '628190000500',
      city: 'Bandung',
      ktp: 'Belum',
      joined: '28 Okt 2026',
    })

    const respons = await minta('/payments/export', 500, 'penyewa', 'Penyewa Baru')

    expect(respons.status).toBe(404)
    expect(await respons.json()).toEqual({ message: 'Profil tenant tidak ditemukan.' })
  })

  it('penyewa ditolak dari laporan kontrak', async () => {
    const respons = await minta('/contracts/export', 405, 'penyewa', 'Siti Sarah')

    expect(respons.status).toBe(403)
    expect(respons.headers.get('content-type')).toContain('application/json')
  })

  it('tanpa token laporan tagihan 401', async () => {
    const respons = await fetch('/payments/export')

    expect(respons.status).toBe(401)
  })

  /* Tanpa token, middleware `auth:api` menolak sebelum controller sempat
     memeriksa peran, jadi jawabannya 401 — bukan 403 seperti peran lain. */
  it('tanpa token laporan kontrak 401', async () => {
    const respons = await fetch('/contracts/export')

    expect(respons.status).toBe(401)
  })
})