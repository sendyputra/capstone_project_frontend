import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { aktifkanSimulasi } from '@/api/mocks/handlers/simulasi'
import { UnitDetailPage } from '@/features/units/pages/unit-detail-page'
import { masukSebagai } from '@/test/sesi'
import { renderWithProviders } from '@/test/render'

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
