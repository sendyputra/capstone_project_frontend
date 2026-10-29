import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LoginPage } from '@/features/auth/pages/login-page'
import { readSession } from '@/features/auth/session'
import { renderWithProviders } from '@/test/render'

function renderHalaman() {
  return renderWithProviders(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('menolak kata sandi pendek tanpa memanggil server', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'pendek')
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(await screen.findByText(/Kata sandi kurang dari 8 karakter/i)).toBeInTheDocument()
    expect(readSession()).toBeNull()
  })

  it('menyimpan sesi saat kredensial cocok', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Email / Nomor WhatsApp'), 'wahyu@umkm.id')
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123')
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    await waitFor(() => expect(readSession()?.user.email).toBe('wahyu@umkm.id'))
    expect(readSession()?.user.role).toBe('pemilik')
  })

  it('menampilkan akun demo sesuai tab yang aktif', async () => {
    renderHalaman()
    expect(screen.getByRole('button', { name: 'Pemilik' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('wahyu@umkm.id')).toBeInTheDocument()
    expect(screen.queryByText('bima@umkm.id')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Penyewa' }))

    expect(screen.getByRole('button', { name: 'Penyewa' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Pemilik' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('bima@umkm.id')).toBeInTheDocument()
    expect(screen.queryByText('wahyu@umkm.id')).not.toBeInTheDocument()
    expect(screen.getByText('demo12345')).toBeInTheDocument()
  })

  it('mengisi email demo tanpa mengisi kata sandi', async () => {
    renderHalaman()
    await userEvent.click(screen.getByRole('button', { name: 'Isi email rina@umkm.id' }))

    expect(screen.getByLabelText('Email / Nomor WhatsApp')).toHaveValue('rina@umkm.id')
    expect(screen.getByLabelText('Kata sandi')).toHaveValue('')
  })

  it('menampilkan pesan saat email tidak dikenal', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Email / Nomor WhatsApp'), 'tidak@ada.id')
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123')
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/tidak cocok/i)
  })

  it('mengantar pemilik ke dashboard-nya setelah masuk', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/masuk']}>
        <Routes>
          <Route path="/masuk" element={<LoginPage />} />
          <Route path="/pemilik" element={<p>Dashboard pemilik</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByLabelText('Email / Nomor WhatsApp'), 'wahyu@umkm.id')
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123')
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByText('Dashboard pemilik')).toBeInTheDocument()
  })

  it('kembali ke tujuan semula setelah masuk, bila layar masuk membawa tujuan', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={[{ pathname: '/masuk', state: { dari: '/katalog/1' } }]}>
        <Routes>
          <Route path="/masuk" element={<LoginPage />} />
          <Route path="/katalog/1" element={<p>Kos Kamar 01</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByLabelText('Email / Nomor WhatsApp'), 'rian@mail.com')
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123')
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByText('Kos Kamar 01')).toBeInTheDocument()
  })
})
