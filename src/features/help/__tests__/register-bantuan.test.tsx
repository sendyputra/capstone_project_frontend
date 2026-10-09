import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { BantuanPage } from '@/features/help/pages/bantuan-page'
import { RegisterPage } from '@/features/auth/pages/register-page'
import { readSession } from '@/features/auth/session'
import { renderWithProviders } from '@/test/render'

function renderDaftar() {
  const router = createMemoryRouter(
    [
      { path: '/daftar', element: <RegisterPage /> },
      { path: '/katalog', element: <p>Katalog unit</p> },
    ],
    { initialEntries: ['/daftar'] },
  )
  return renderWithProviders(<RouterProvider router={router} />)
}

describe('RegisterPage', () => {
  it('menyediakan blok verifikasi KTP untuk mode daftar', async () => {
    renderDaftar()
    expect(await screen.findByText('Verifikasi KTP (Fitur OCR)')).toBeInTheDocument()
    expect(screen.getByText(/Unggah foto KTP Anda/)).toBeInTheDocument()
  })

  it('membaca KTP: gagal sekali, lalu berhasil saat diulang', async () => {
    renderDaftar()
    const input = await screen.findByLabelText('Berkas KTP')

    await userEvent.upload(input, new File(['x'], 'ktp.jpg', { type: 'image/jpeg' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/KTP gagal dibaca karena koneksi terputus/i)

    await userEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    expect(await screen.findByText('Data KTP terbaca. Periksa hasilnya sebelum mendaftar.')).toBeInTheDocument()
  })

  it('mendaftar lalu menulis sesinya dan menuju katalog', async () => {
    renderDaftar()

    await userEvent.type(await screen.findByLabelText('Email / Nomor WhatsApp'), 'baru@mail.com')
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123')
    await userEvent.click(screen.getByRole('button', { name: 'Daftar Sekarang' }))

    await waitFor(() => expect(readSession()?.user.email).toBe('baru@mail.com'))
    expect(await screen.findByText('Katalog unit')).toBeInTheDocument()
  })
})

describe('BantuanPage', () => {
  it('menyediakan kanal Instagram dan WhatsApp', () => {
    renderWithProviders(<BantuanPage />)

    expect(screen.getByRole('link', { name: /@Aditiya.wibisono/ })).toHaveAttribute('href', 'https://instagram.com/Aditiya.wibisono')
    expect(screen.getByRole('link', { name: /\+62 851-8998-9912/ })).toHaveAttribute('href', 'https://wa.me/6285189989912')
  })
})
