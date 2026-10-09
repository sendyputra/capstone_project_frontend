import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { UnitListPage } from '@/features/units/pages/unit-list-page'
import { writeSession } from '@/features/auth/session'
import { renderWithProviders } from '@/test/render'

function renderHalaman() {
  writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' } })
  return renderWithProviders(
    <MemoryRouter initialEntries={['/pemilik/unit']}>
      <UnitListPage />
    </MemoryRouter>,
  )
}

describe('UnitListPage', () => {
  it('menampilkan rangka bayangan lebih dulu, lalu daftar unit milik pemilik', async () => {
    renderHalaman()
    expect(screen.getAllByTestId('baris-rangka').length).toBeGreaterThan(0)
    await waitFor(() => expect(screen.getByText('Kos Kamar 01')).toBeInTheDocument())
    expect(screen.queryByText('Kos Kamar 04')).not.toBeInTheDocument()
  })

  it('mengubah status unit dan memperbarui barisnya', async () => {
    renderHalaman()
    const baris = (await screen.findByText('Kos Kamar 01')).closest('tr')!
    await userEvent.click(within(baris).getByRole('button', { name: /Ubah status/i }))
    await waitFor(() => expect(within(baris).getByText('Terisi')).toBeInTheDocument())
  })

  it('menghapus unit hanya setelah disetujui, dan batal tidak mengubah apa pun', async () => {
    renderHalaman()
    const baris = (await screen.findByText('Kontrakan Rumah Asri Type 36')).closest('tr')!
    await userEvent.click(within(baris).getByRole('button', { name: /Hapus/i }))
    await userEvent.click(await screen.findByRole('button', { name: 'Batal' }))
    expect(screen.getByText('Kontrakan Rumah Asri Type 36')).toBeInTheDocument()

    await userEvent.click(within(baris).getByRole('button', { name: /Hapus/i }))
    await userEvent.click(await screen.findByRole('button', { name: 'Hapus unit' }))
    await waitFor(() => expect(screen.queryByText('Kontrakan Rumah Asri Type 36')).not.toBeInTheDocument())
  })

  it('menampilkan sebab saat ubah status gagal, bukan diam saja', async () => {
    const { server } = await import('@/api/mocks/server')
    const { http, HttpResponse } = await import('msw')
    server.use(http.patch('/units/:id', () => HttpResponse.error()))
    renderHalaman()
    const baris = (await screen.findByText('Kos Kamar 01')).closest('tr')!
    await userEvent.click(within(baris).getByRole('button', { name: /Ubah status/i }))
    expect(await screen.findByText(/Koneksi terputus/i)).toBeInTheDocument()
  })

  it('menampilkan galat bersebab dan coba ulang saat jaringan gagal', async () => {
    const { server } = await import('@/api/mocks/server')
    const { http, HttpResponse } = await import('msw')
    server.use(http.get('/units', () => HttpResponse.error()))
    renderHalaman()
    expect(await screen.findByRole('alert')).toHaveTextContent(/Koneksi terputus/i)
    expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
  })
})
