import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { AppShell } from '@/app/layouts/app-shell'
import { readSession, writeSession, type Session } from '@/features/auth/session'
import { renderWithProviders } from '@/test/render'

const sesi: Session = {
  token: 'mock.abc.tanda',
  user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: 'pemilik' },
}

function renderShell() {
  const router = createMemoryRouter([{ element: <AppShell />, children: [{ path: '/', element: <p>Isi halaman</p> }] }], {
    initialEntries: ['/'],
  })
  return renderWithProviders(<RouterProvider router={router} />)
}

describe('AppShell', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('menampilkan nama pengguna, label peran, dan atribut data-role', async () => {
    writeSession(sesi)
    renderShell()

    expect(await screen.findByText('Pak Wahyu')).toBeInTheDocument()
    expect(screen.getByText('Pemilik')).toBeInTheDocument()
    await waitFor(() => expect(document.documentElement.dataset.role).toBe('owner'))
  })

  it('mengganti tema saat tombolnya ditekan', async () => {
    writeSession(sesi)
    renderShell()

    await userEvent.click(await screen.findByRole('button', { name: 'Aktifkan tema gelap' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('membuang sesi saat keluar ditekan', async () => {
    writeSession(sesi)
    renderShell()

    await userEvent.click(await screen.findByRole('button', { name: 'Keluar' }))
    expect(readSession()).toBeNull()
  })

  it('menampilkan tautan kerja sesuai peran yang masuk', async () => {
    writeSession(sesi)
    renderShell()

    expect(await screen.findByRole('link', { name: /Dashboard/ })).toHaveAttribute('href', '/pemilik')
    expect(screen.getByRole('link', { name: /Unit Saya/ })).toHaveAttribute('href', '/pemilik/unit')
    expect(screen.getByRole('link', { name: /Pengajuan Sewa/ })).toHaveAttribute('href', '/pemilik/pengajuan')
    expect(screen.getByRole('link', { name: /Bantuan/ })).toHaveAttribute('href', '/bantuan')
    expect(screen.queryByRole('link', { name: /Tagihan Saya/ })).not.toBeInTheDocument()
  })

  it('menawarkan masuk dan daftar kepada tamu', async () => {
    renderShell()

    expect(await screen.findByRole('link', { name: 'Masuk' })).toHaveAttribute('href', '/masuk')
    expect(screen.getByRole('link', { name: /Daftar/ })).toHaveAttribute('href', '/daftar')
  })
})
