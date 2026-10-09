import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { PengajuanPage } from '@/features/bookings/pages/pengajuan-page'
import { masukSebagai } from '@/test/sesi'
import { renderWithProviders } from '@/test/render'

function renderPengajuan() {
  masukSebagai(402, 'pemilik', 'Pak Wahyu')
  return renderWithProviders(
    <MemoryRouter initialEntries={['/pemilik/pengajuan']}>
      <PengajuanPage />
    </MemoryRouter>,
  )
}

describe('PengajuanPage', () => {
  it('menampilkan pengajuan untuk unit pemilik beserta kontak WhatsApp', async () => {
    renderPengajuan()

    const baris = (await screen.findByText('Rian Pratama')).closest('tr')!
    expect(within(baris).getByText('Kos Kamar 01')).toBeInTheDocument()
    expect(within(baris).getByText('628123456789')).toBeInTheDocument()
    expect(within(baris).getByText('Menunggu Persetujuan')).toBeInTheDocument()
    expect(screen.getByText('1 Perlu Respon')).toBeInTheDocument()
  })

  it('menerima pengajuan lalu menandainya disetujui', async () => {
    renderPengajuan()
    const baris = (await screen.findByText('Rian Pratama')).closest('tr')!

    await userEvent.click(within(baris).getByRole('button', { name: 'Terima' }))
    await waitFor(() => expect(within(baris).getByText('Disetujui')).toBeInTheDocument())
    expect(await screen.findByText(/Pengajuan Rian Pratama diterima/i)).toBeInTheDocument()
  })

  it('menolak pengajuan setelah dikonfirmasi', async () => {
    renderPengajuan()
    const baris = (await screen.findByText('Rian Pratama')).closest('tr')!

    await userEvent.click(within(baris).getByRole('button', { name: 'Tolak' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Tolak pengajuan' }))
    await waitFor(() => expect(within(baris).getByText('Ditolak')).toBeInTheDocument())
  })
})
