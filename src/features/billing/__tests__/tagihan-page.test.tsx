import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { aktifkanSimulasi } from '@/api/mocks/handlers/simulasi'
import { server } from '@/api/mocks/server'
import { TagihanPage } from '@/features/billing/pages/tagihan-page'
import { pantauMetode } from '@/test/metode'
import { masukSebagai } from '@/test/sesi'
import { stubUnduhan } from '@/test/unduh'
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

  it('mengunduh laporan tagihan dari server', async () => {
    renderTagihan()
    const rekaman = pantauMetode()
    const unduh = stubUnduhan()
    await screen.findByText('Tagihan Oktober 2026')

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
    await screen.findByText('Tagihan Oktober 2026')

    await userEvent.click(screen.getByRole('button', { name: 'Unduh CSV' }))

    expect(await screen.findByText('Laporan gagal dibuat.')).toBeInTheDocument()
    expect(unduh.nama).toHaveLength(0)
  })
})
