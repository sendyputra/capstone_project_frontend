import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { KatalogPage } from '@/features/units/pages/katalog-page'
import { masukSebagai } from '@/test/sesi'
import { renderWithProviders } from '@/test/render'

function renderKatalog() {
  masukSebagai(405, 'penyewa', 'Siti Sarah')
  return renderWithProviders(
    <MemoryRouter initialEntries={['/katalog']}>
      <Routes>
        <Route path="/katalog" element={<KatalogPage />} />
        <Route path="/katalog/:id" element={<p>Layar detail</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('KatalogPage', () => {
  it('menampilkan seluruh unit kepada pengunjung tanpa akun', async () => {
    localStorage.clear()
    renderWithProviders(
      <MemoryRouter initialEntries={['/katalog']}>
        <KatalogPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('5 Unit Ditemukan')).toBeInTheDocument()
    expect(screen.getByText('Kos Putri Melati Kamar B2')).toBeInTheDocument()
  })

  it('menampilkan seluruh unit dengan lencana status dan jumlahnya', async () => {
    renderKatalog()

    const kartu = (await screen.findByText('Kos Kamar 01')).closest('article')!
    expect(kartu).toHaveTextContent('Rp 1.200.000')
    expect(within(kartu).getByText('Tersedia')).toHaveClass('bg-brand-success')
    expect(screen.getByText('5 Unit Ditemukan')).toBeInTheDocument()

    const terisi = screen.getByText('Kontrakan Rumah Asri Type 36').closest('article')!
    expect(within(terisi).getByText('Terisi')).toHaveClass('bg-brand-danger')
  })

  it('menyaring lewat kata kunci, reset, dan status', async () => {
    renderKatalog()
    await screen.findByText('Kos Kamar 01')

    await userEvent.type(screen.getByLabelText(/Cari Nama atau Lokasi/), 'ruko')
    await waitFor(() => expect(screen.getByText('1 Unit Ditemukan')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Reset Filter' }))
    await waitFor(() => expect(screen.getByText('5 Unit Ditemukan')).toBeInTheDocument())

    await userEvent.selectOptions(screen.getByLabelText('Status Ketersediaan'), 'Terisi')
    await waitFor(() => expect(screen.getByText('2 Unit Ditemukan')).toBeInTheDocument())
  })

  it('menampilkan keadaan kosong saat tak ada yang cocok', async () => {
    renderKatalog()
    await screen.findByText('Kos Kamar 01')

    await userEvent.type(screen.getByLabelText(/Cari Nama atau Lokasi/), 'tidak-ada-unit')
    expect(await screen.findByText(/Tidak ada unit sewa yang sesuai/)).toBeInTheDocument()
    expect(screen.getByText('0 Unit Ditemukan')).toBeInTheDocument()
  })

  it('membuka layar detail saat tombolnya ditekan', async () => {
    renderKatalog()
    const kartu = (await screen.findByText('Kos Kamar 01')).closest('article')!
    await userEvent.click(within(kartu).getByRole('link', { name: 'Detail Unit' }))
    expect(await screen.findByText('Layar detail')).toBeInTheDocument()
  })
})
