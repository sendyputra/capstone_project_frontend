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

  it('menampilkan pesan saat email tidak dikenal', async () => {
    renderHalaman()
    await userEvent.type(screen.getByLabelText('Email / Nomor WhatsApp'), 'tidak@ada.id')
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123')
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/tidak cocok/i)
  })

  it('mengantar tiap peran ke rute awalnya sendiri', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/masuk']}>
        <Routes>
          <Route path="/masuk" element={<LoginPage />} />
          <Route path="/pemilik" element={<p>Dashboard pemilik</p>} />
          <Route path="/admin/unit" element={<p>Area admin</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByLabelText('Email / Nomor WhatsApp'), 'admin@nusantarabooking.id')
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123')
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByText('Area admin')).toBeInTheDocument()
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
