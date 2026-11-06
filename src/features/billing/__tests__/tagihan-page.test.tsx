import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { aktifkanSimulasi } from '@/api/mocks/handlers/simulasi'
import { server } from '@/api/mocks/server'
import { TagihanPage } from '@/features/billing/pages/tagihan-page'
import { pantauMetode } from '@/test/metode'
import { masukSebagai } from '@/test/sesi'
import { stubUnduhan } from '@/test/unduh'
import { renderWithProviders } from '@/test/render'

/* Skenario data contoh dibekukan pada Oktober 2026: tagihan diturunkan sampai
   bulan berjalan, dan `booked_dates` unit memakai bulan berjalan. Tanpa patokan
   ini asersi "Tagihan Oktober 2026" dan jumlah tunggakan berubah setiap bulan
   kalender berganti. */
vi.mock('@/lib/tanggal', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/tanggal')>()),
  tanggalHariIni: () => '2026-10-15',
}))

function renderTagihan(sesi: { id: number; nama: string } = { id: 405, nama: 'Siti Sarah' }) {
  masukSebagai(sesi.id, 'penyewa', sesi.nama)
  return renderWithProviders(
    <MemoryRouter initialEntries={['/tagihan']}>
      <TagihanPage />
    </MemoryRouter>,
  )
}

describe('TagihanPage', () => {
  it('menampilkan tagihan milik penyewa yang masuk saja', async () => {
    renderTagihan()

    const baris = (await screen.findByText('Oktober 2026')).closest('tr')!
    expect(within(baris).getByText('Kontrakan Rumah Asri Type 36')).toBeInTheDocument()
    expect(within(baris).getByText('Rp 2.500.000')).toBeInTheDocument()
    expect(within(baris).getByText('Belum Bayar')).toBeInTheDocument()
    expect(screen.getByText('1 Belum Dibayar')).toBeInTheDocument()
    expect(screen.queryByText('Kontrakan Melati Type 45')).not.toBeInTheDocument()
  })

  it('unggah bukti: gagal sekali, lalu menunggu verifikasi', async () => {
    aktifkanSimulasi()
    renderTagihan()
    await screen.findByText('Oktober 2026')

    await userEvent.upload(screen.getByLabelText('Unggah Bukti'), new File(['x'], 'bukti-okt.jpg', { type: 'image/jpeg' }))
    expect(await screen.findByText(/gagal diunggah karena koneksi terputus/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    /* Tunggu berkasnya, bukan label statusnya: "Menunggu Verifikasi" juga
       muncul sebagai pilihan pada saringan status, jadi teks itu lolos
       sebelum unggahan benar-benar selesai. */
    const barisBukti = (await screen.findByText('bukti-okt.jpg')).closest('tr')!
    expect(within(barisBukti).getByText('Menunggu Verifikasi')).toBeInTheDocument()
  })

  /* Saringan per kolom harus benar-benar terpasang di halaman, bukan hanya di
     komponen tabel: pilihan status menyaring barisnya. */
  it('menyaring tagihan lewat kolom status', async () => {
    renderTagihan()

    await screen.findByText('Oktober 2026')
    await userEvent.selectOptions(screen.getByLabelText('Saring Status'), 'Belum Bayar')

    /* Label status juga hidup sebagai pilihan saringan, jadi yang diperiksa
       hanya isi baris data. */
    const isiBaris = [...screen.getByRole('table').querySelectorAll('tbody tr')].map((tr) => tr.textContent).join(' ')
    expect(isiBaris).toContain('Oktober 2026')
    expect(isiBaris).not.toContain('Lunas')
  })

  it('mengunduh laporan tagihan dari server', async () => {
    renderTagihan()
    const rekaman = pantauMetode()
    const unduh = stubUnduhan()
    await screen.findByText('Oktober 2026')

    await userEvent.click(screen.getByRole('button', { name: 'Unduh CSV' }))

    await waitFor(() => expect(rekaman).toContain('GET /payments/export'))
    await waitFor(() => expect(unduh.nama[0]).toMatch(/^laporan-tagihan-\d{8}\.csv$/))
    expect(await screen.findByText('Laporan tagihan diunduh.')).toBeInTheDocument()
  })

  it('menampilkan pesan galat saat unduhan gagal', async () => {
    server.use(
      http.get('/payments/export', () => HttpResponse.json({ message: 'Laporan gagal dibuat.' }, { status: 500 })),
    )
    renderTagihan()
    const unduh = stubUnduhan()
    await screen.findByText('Oktober 2026')

    await userEvent.click(screen.getByRole('button', { name: 'Unduh CSV' }))

    expect(await screen.findByText('Laporan gagal dibuat.')).toBeInTheDocument()
    expect(unduh.nama).toHaveLength(0)
  })

  /* Sebelum ini penyewa tidak punya tempat melihat masa sewanya: `Tagihan` hanya
     membawa bulan dan nominal. Ringkasan kontrak memberi tanggal mulai–selesai
     tanpa perlu rute baru. */
  it('menampilkan masa sewa dan memisahkan pengajuan dari sewa berjalan', async () => {
    renderTagihan()

    const berjalan = await screen.findByRole('region', { name: 'Sewa berjalan' })
    expect(within(berjalan).getAllByText('Kontrakan Rumah Asri Type 36').length).toBeGreaterThan(0)
    expect(within(berjalan).getByText(/1 Sep 2026 – 28 Feb 2027/)).toBeInTheDocument()
    expect(within(berjalan).getByText(/Rp 2\.500\.000 \/ bln/)).toBeInTheDocument()

    const pengajuan = screen.getByRole('region', { name: 'Pengajuan sewa' })
    expect(within(pengajuan).getByText('Kontrakan Rumah Asri Type 36')).toBeInTheDocument()
    expect(within(pengajuan).getByText(/menunggu persetujuan pemilik/i)).toBeInTheDocument()
  })

  /* Kontrak 218 milik Dimas sudah `Selesai`. Sebelumnya seluruh barisnya lenyap
     dari layar karena penyusun tagihan hanya menerima kontrak `Aktif`. */
  it('tetap menampilkan riwayat bulan setelah kontrak selesai', async () => {
    renderTagihan({ id: 413, nama: 'Dimas Prakoso' })

    const riwayat = await screen.findByRole('region', { name: 'Riwayat sewa' })
    expect(within(riwayat).getByText('Kos Putri Melati Kamar B2')).toBeInTheDocument()
    expect(within(riwayat).getByText('Selesai')).toBeInTheDocument()
    expect(within(riwayat).getByText(/Berakhir 30 Apr 2026/)).toBeInTheDocument()
    expect(within(riwayat).getByText(/Selesai normal/)).toBeInTheDocument()
    expect(within(riwayat).getByText('Desember 2025')).toBeInTheDocument()
    expect(within(riwayat).getByText('April 2026')).toBeInTheDocument()
    expect(within(riwayat).getByText('Lunas')).toBeInTheDocument()
    expect(within(riwayat).getAllByText('Belum Bayar').length).toBeGreaterThan(0)
    expect(within(riwayat).queryByLabelText('Unggah Bukti')).not.toBeInTheDocument()
  })

  it('bisa melipat riwayat sewa', async () => {
    renderTagihan({ id: 413, nama: 'Dimas Prakoso' })

    const riwayat = await screen.findByRole('region', { name: 'Riwayat sewa' })
    expect(within(riwayat).getByText('Kos Putri Melati Kamar B2')).toBeInTheDocument()

    await userEvent.click(within(riwayat).getByRole('button', { name: 'Lipat riwayat' }))
    expect(within(riwayat).queryByText('Kos Putri Melati Kamar B2')).not.toBeInTheDocument()

    await userEvent.click(within(riwayat).getByRole('button', { name: 'Buka riwayat' }))
    expect(within(riwayat).getByText('Kos Putri Melati Kamar B2')).toBeInTheDocument()
  })

  /* Kontrak `Aktif` yang tanggal selesainya sudah lewat masuk riwayat. Bulannya
     dulu dirender dua kali — sekali di tabel berjalan dengan tombol unggah,
     sekali di riwayat — sehingga penyewa melihat tagihan yang sama dua kali. */
  it('menampilkan bulan kontrak yang sudah lewat hanya di riwayat', async () => {
    server.use(
      http.get('/contracts', () =>
        HttpResponse.json({
          data: [
            {
              id: 901,
              unit_id: 2,
              tenant_id: 2,
              start_date: '2026-08-01',
              end_date: '2026-09-30',
              total_price: 3000000,
              status: 'active',
              tenant: { name: 'Dimas Prakoso' },
              unit: { name: 'Kos Lama', owner: { name: 'Pak Wahyu' } },
            },
          ],
        }),
      ),
    )
    renderTagihan({ id: 413, nama: 'Dimas Prakoso' })

    const riwayat = await screen.findByRole('region', { name: 'Riwayat sewa' })
    expect(within(riwayat).getByText('Agustus 2026')).toBeInTheDocument()
    expect(screen.getAllByText('Agustus 2026')).toHaveLength(1)
    expect(screen.queryByText('Unggah Bukti')).not.toBeInTheDocument()
  })
})
