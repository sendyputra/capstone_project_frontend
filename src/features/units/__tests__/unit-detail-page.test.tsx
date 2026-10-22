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

/* `POST /contracts` belum punya handler mock — adaptor ke backend baru datang
   pada tugas integrasi. Tes ini memasang handler sementaranya sendiri dengan
   semantik yang sama seperti `POST /bookings`: gagal sekali saat simulasi
   menyala, lalu berhasil. Badan permintaan direkam supaya tanggal dan total
   yang dihitung halaman ikut diperiksa, bukan hanya pesan galatnya. */
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
            status: 'Menunggu',
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

function renderDetail(id = '1') {
  masukSebagai(405, 'penyewa', 'Siti Sarah')
  const router = createMemoryRouter(
    [
      { path: '/katalog', element: <p>Katalog unit</p> },
      { path: '/katalog/:id', element: <UnitDetailPage /> },
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
    expect(screen.getByTestId('hari-5')).toHaveClass('bg-brand-danger-soft')
    expect(screen.getByTestId('hari-1')).toHaveClass('bg-brand-success-soft')
  })

  it('mengirim pengajuan: gagal sekali, lalu berhasil dan kembali', async () => {
    aktifkanSimulasi()
    renderDetail()
    await screen.findByRole('heading', { name: 'Kos Kamar 01' })

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
    expect(mulai).toHaveValue(new Date().toISOString().slice(0, 10))
    /* `userEvent.type` tidak bisa menulis sebagian tanggal ke input date; satu
       perubahan nilai utuh lebih dekat dengan perilaku pemilih tanggal. */
    fireEvent.change(mulai, { target: { value: '2026-11-01' } })
    await userEvent.selectOptions(screen.getByLabelText('Durasi'), '6')

    await userEvent.click(screen.getByRole('button', { name: 'Ajukan Sewa' }))
    expect(await screen.findByText('Katalog unit')).toBeInTheDocument()
    expect(terkirim).toEqual([{ unit_id: 1, start_date: '2026-11-01', end_date: '2027-05-01', total_price: 7_200_000 }])
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
