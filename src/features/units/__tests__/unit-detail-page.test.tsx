import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '@/api/mocks/server'
import { aktifkanSimulasi, gagalSekali } from '@/api/mocks/handlers/simulasi'
import { UnitDetailPage } from '@/features/units/pages/unit-detail-page'
import { masukSebagai } from '@/test/sesi'
import { renderWithProviders } from '@/test/render'
import { tanggalHariIni } from '@/lib/tanggal'

/* Mock sudah punya `POST /contracts`, tetapi tidak mensimulasikan kegagalan
   jaringan — bagian itu khas demo. Tes ini memasang handler sementaranya sendiri
   dengan semantik yang sama: gagal sekali saat simulasi menyala, lalu berhasil.
   Badan permintaan direkam supaya tanggal dan total yang dihitung halaman ikut
   diperiksa, bukan hanya pesan galatnya. */
type BadanKontrak = { unit_id: number; start_date: string; end_date: string; total_price: number }

let terkirim: BadanKontrak[] = []

function pasangHandlerKontrak() {
  server.use(
    http.post('/contracts', async ({ request }) => {
      const badan = (await request.json()) as BadanKontrak
      terkirim.push(badan)
      if (gagalSekali('POST /contracts')) {
        return HttpResponse.json(
          { message: 'Pengajuan gagal terkirim karena koneksi terputus. Periksa jaringan, lalu coba lagi.' },
          { status: 500 },
        )
      }
      return HttpResponse.json(
        {
          data: {
            id: 900,
            ...badan,
            tenant_id: 2,
            status: 'pending',
            renter_name: 'Siti Sarah',
            unit_title: 'Kos Kamar 01',
            owner_name: 'Pak Wahyu',
            term: '3 bulan',
            monthly: 1_200_000,
          },
        },
        { status: 201 },
      )
    }),
  )
}

function renderDetail(id = '1', mode: 'penyewa' | 'pemilik' = 'penyewa') {
  if (mode === 'pemilik') masukSebagai(402, 'pemilik', 'Pak Wahyu')
  else masukSebagai(405, 'penyewa', 'Siti Sarah')
  const router = createMemoryRouter(
    [
      { path: '/katalog', element: <p>Katalog unit</p> },
      { path: '/katalog/:id', element: <UnitDetailPage mode={mode} /> },
    ],
    { initialEntries: [`/katalog/${id}`] },
  )
  return renderWithProviders(<RouterProvider router={router} />)
}

describe('UnitDetailPage', () => {
  beforeEach(() => {
    terkirim = []
    pasangHandlerKontrak()
  })

  it('memberi tahu saat unit tidak ada, bukan halaman kosong', async () => {
    renderDetail('999')

    expect(await screen.findByRole('alert')).toHaveTextContent('Unit tidak ditemukan.')
    expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
  })

  it('memberi tahu saat id unit bukan angka', async () => {
    renderDetail('abc')

    expect(await screen.findByRole('alert')).toHaveTextContent('Unit tidak ditemukan.')
  })

  it('menampilkan fasilitas dan kalender ketersediaan', async () => {
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Kos Kamar 01' })).toBeInTheDocument()
    expect(screen.getByText('KM Dalam')).toBeInTheDocument()
    expect(screen.getByText('Fasilitas Unit:')).toBeInTheDocument()
    expect(screen.getByText('Kalender Ketersediaan Tanggal:')).toBeInTheDocument()
    const bulan = tanggalHariIni().slice(0, 7)
    expect(screen.getByTestId(`tanggal-${bulan}-05`)).toHaveClass('bg-brand-danger-soft')
    expect(screen.getByTestId(`tanggal-${bulan}-01`)).toHaveClass('bg-brand-success-soft')
  })

  it('pemilik melihat panel blokir', async () => {
    renderDetail('1', 'pemilik')

    expect(await screen.findByLabelText('Mulai blokir')).toBeInTheDocument()
  })

  it('penyewa tidak melihat panel blokir', async () => {
    renderDetail()

    await screen.findByRole('heading', { name: 'Kos Kamar 01' })
    expect(screen.queryByLabelText('Mulai blokir')).not.toBeInTheDocument()
  })

  it('pemilik memblokir rentang dan baris muncul', async () => {
    renderDetail('1', 'pemilik')
    await screen.findByRole('heading', { name: 'Kos Kamar 01' })

    fireEvent.change(screen.getByLabelText('Mulai blokir'), { target: { value: '2026-11-10' } })
    fireEvent.change(screen.getByLabelText('Selesai blokir'), { target: { value: '2026-11-12' } })
    await userEvent.click(screen.getByRole('button', { name: 'Blokir Tanggal' }))

    expect(await screen.findByText('10 Nov 2026 – 12 Nov 2026')).toBeInTheDocument()
  })

  it('galat overlap ditampilkan', async () => {
    server.use(
      http.post('/units/1/blocks', () =>
        HttpResponse.json({ message: 'Tanggal yang dipilih sudah terisi atau diblokir.' }, { status: 422 }),
      ),
    )
    renderDetail('1', 'pemilik')
    await screen.findByRole('heading', { name: 'Kos Kamar 01' })

    fireEvent.change(screen.getByLabelText('Mulai blokir'), { target: { value: '2026-11-10' } })
    fireEvent.change(screen.getByLabelText('Selesai blokir'), { target: { value: '2026-11-12' } })
    await userEvent.click(screen.getByRole('button', { name: 'Blokir Tanggal' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('sudah terisi atau diblokir')
  })

  it('mengirim pengajuan: gagal sekali, lalu berhasil dan kembali', async () => {
    aktifkanSimulasi()
    renderDetail()
    await screen.findByRole('heading', { name: 'Kos Kamar 01' })
    /* Tanggal dijauhkan dari `booked_dates` contoh (bulan berjalan) supaya yang
       diuji di sini kegagalan jaringan, bukan penolakan tanggal. */
    fireEvent.change(screen.getByLabelText('Mulai sewa'), { target: { value: '2030-01-01' } })

    await userEvent.click(screen.getByRole('button', { name: 'Ajukan Sewa' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/koneksi terputus/i)

    await userEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    expect(await screen.findByText('Katalog unit')).toBeInTheDocument()
    expect(await screen.findByText('Pengajuan sewa terkirim dan masuk daftar pengajuan pemilik.')).toBeInTheDocument()
  })

  it('mengirim tanggal mulai dan durasi sebagai tanggal akhir dan total harga', async () => {
    renderDetail()
    await screen.findByRole('heading', { name: 'Kos Kamar 01' })

    const mulai = screen.getByLabelText('Mulai sewa')
    expect(mulai).toHaveValue(tanggalHariIni())
    /* `userEvent.type` tidak bisa menulis sebagian tanggal ke input date; satu
       perubahan nilai utuh lebih dekat dengan perilaku pemilih tanggal. Tanggal
       dijauhkan ke masa depan supaya tidak menabrak `booked_dates` contoh, yang
       selalu berada di bulan berjalan. */
    fireEvent.change(mulai, { target: { value: '2030-01-01' } })
    await userEvent.selectOptions(screen.getByLabelText('Durasi'), '6')

    await userEvent.click(screen.getByRole('button', { name: 'Ajukan Sewa' }))
    expect(await screen.findByText('Katalog unit')).toBeInTheDocument()
    expect(terkirim).toEqual([{ unit_id: 1, start_date: '2030-01-01', end_date: '2030-07-01', total_price: 7_200_000 }])
  })

  it('menolak tanggal mulai sebelum hari ini', async () => {
    renderDetail()
    await screen.findByRole('heading', { name: 'Kos Kamar 01' })

    fireEvent.change(screen.getByLabelText('Mulai sewa'), { target: { value: '2020-01-01' } })

    await userEvent.click(screen.getByRole('button', { name: 'Ajukan Sewa' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('tidak boleh sebelum hari ini')
    expect(terkirim).toEqual([])
  })

  it('menolak rentang yang menabrak tanggal terisi dan menyebut tanggalnya', async () => {
    server.use(
      http.get('/detail/unit/1', () =>
        HttpResponse.json({
          data: {
            id: 1,
            owner_id: 402,
            name: 'Kos Kamar 01',
            address: 'Bandung Barat',
            price: 1_200_000,
            status: 'available',
            type: 'Kamar Kos',
            image: '/demo/kos.jpg',
            facilities: ['KM Dalam'],
            booked_dates: ['2030-03-10'],
            blocked_dates: [],
          },
        }),
      ),
    )
    renderDetail()
    await screen.findByRole('heading', { name: 'Kos Kamar 01' })

    fireEvent.change(screen.getByLabelText('Mulai sewa'), { target: { value: '2030-03-01' } })

    await userEvent.click(screen.getByRole('button', { name: 'Ajukan Sewa' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Tanggal 10 Mar 2030 sudah terisi atau diblokir.')
    expect(terkirim).toEqual([])
  })

  it('menolak tanggal mulai yang kosong dengan pesan, tanpa mengirim apa pun', async () => {
    renderDetail()
    await screen.findByRole('heading', { name: 'Kos Kamar 01' })

    /* Pengguna bisa mengosongkan input date (pilih semua lalu hapus); `onChange`
       mengirim `''` dan dulu itu membuat `hitungSewa` melempar `RangeError`. */
    fireEvent.change(screen.getByLabelText('Mulai sewa'), { target: { value: '' } })

    await userEvent.click(screen.getByRole('button', { name: 'Ajukan Sewa' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Tanggal mulai sewa wajib diisi.')
    expect(terkirim).toEqual([])
  })

  it('mengantar pengunjung tanpa sesi ke layar masuk, bukan ke galat', async () => {
    const router = createMemoryRouter(
      [
        { path: '/masuk', element: <p>Layar masuk</p> },
        { path: '/katalog', element: <p>Katalog unit</p> },
        { path: '/katalog/:id', element: <UnitDetailPage /> },
      ],
      { initialEntries: ['/katalog/1'] },
    )
    renderWithProviders(<RouterProvider router={router} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Ajukan Sewa' }))
    expect(await screen.findByText('Layar masuk')).toBeInTheDocument()
  })
})
