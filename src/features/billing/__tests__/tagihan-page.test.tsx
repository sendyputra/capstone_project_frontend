import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { aktifkanSimulasi } from '@/api/mocks/handlers/simulasi'
import { TagihanPage } from '@/features/billing/pages/tagihan-page'
import { masukSebagai } from '@/test/sesi'
import { renderWithProviders } from '@/test/render'

function renderTagihan() {
  masukSebagai(405, 'penyewa', 'Siti Sarah')
  return renderWithProviders(
    <MemoryRouter initialEntries={['/tagihan']}>
      <TagihanPage />
    </MemoryRouter>,
  )
}

describe('TagihanPage', () => {
  it('menampilkan tagihan milik penyewa yang masuk saja', async () => {
    renderTagihan()

    const baris = (await screen.findByText('Tagihan Oktober 2026')).closest('tr')!
    expect(within(baris).getByText('Kontrakan Rumah Asri Type 36')).toBeInTheDocument()
    expect(within(baris).getByText('Rp 2.500.000')).toBeInTheDocument()
    expect(within(baris).getByText('Belum Bayar')).toBeInTheDocument()
    expect(screen.getByText('1 Belum Dibayar')).toBeInTheDocument()
    expect(screen.queryByText('Kontrakan Melati Type 45')).not.toBeInTheDocument()
  })

  it('unggah bukti: gagal sekali, lalu menunggu verifikasi', async () => {
    aktifkanSimulasi()
    renderTagihan()
    await screen.findByText('Tagihan Oktober 2026')

    await userEvent.upload(screen.getByLabelText('Unggah Bukti'), new File(['x'], 'bukti-okt.jpg', { type: 'image/jpeg' }))
    expect(await screen.findByText(/gagal diunggah karena koneksi terputus/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    await waitFor(() => expect(screen.getByText('Menunggu Verifikasi')).toBeInTheDocument())
    expect(screen.getByText('bukti-okt.jpg')).toBeInTheDocument()
  })
})
