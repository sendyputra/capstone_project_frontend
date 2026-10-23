import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/* Tesseract tidak dijalankan di tes: pembacaan KTP diuji di
   `src/features/auth/ocr/__tests__/bacaKtp.test.ts`. */
const bacaKtp = vi.fn()
vi.mock('@/features/auth/ocr/bacaKtp', () => ({ bacaKtp: (...args: unknown[]) => bacaKtp(...args) }))

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

async function isiFormulir(email: string) {
  await userEvent.type(await screen.findByLabelText('Nama lengkap'), 'Budi Santoso')
  await userEvent.type(screen.getByLabelText('NIK'), '3578123456780001')
  await userEvent.type(screen.getByLabelText('Email / Nomor WhatsApp'), email)
  await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123')
  await userEvent.type(screen.getByLabelText('Ulangi kata sandi'), 'rahasia123')
}

describe('RegisterPage', () => {
  beforeEach(() => bacaKtp.mockReset())

  it('menyediakan blok verifikasi KTP untuk mode daftar', async () => {
    renderDaftar()
    expect(await screen.findByText('Verifikasi KTP (Fitur OCR)')).toBeInTheDocument()
    expect(screen.getByText(/Unggah foto KTP Anda/)).toBeInTheDocument()
  })

  it('menawarkan isian manual saat KTP tidak terbaca', async () => {
    bacaKtp.mockResolvedValue({ nik: '', nama: '', yakin: false })
    renderDaftar()

    await userEvent.upload(await screen.findByLabelText('Berkas KTP'), new File(['x'], 'ktp.jpg', { type: 'image/jpeg' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/KTP tidak terbaca/i)
    expect(screen.getByLabelText('NIK')).toBeEnabled()
    expect(screen.getByLabelText('Nama lengkap')).toBeEnabled()
  })

  it('mendaftar lalu menulis sesinya dan menuju katalog', async () => {
    bacaKtp.mockResolvedValue({ nik: '3578123456780001', nama: 'BUDI SANTOSO', yakin: true })
    renderDaftar()

    await userEvent.upload(await screen.findByLabelText('Berkas KTP'), new File(['x'], 'ktp.jpg', { type: 'image/jpeg' }))
    await screen.findByText('Data KTP terbaca. Periksa hasilnya sebelum mendaftar.')
    await userEvent.type(screen.getByLabelText('Email / Nomor WhatsApp'), 'baru@mail.com')
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123')
    await userEvent.type(screen.getByLabelText('Ulangi kata sandi'), 'rahasia123')
    await userEvent.click(screen.getByRole('button', { name: 'Daftar Sekarang' }))

    await waitFor(() => expect(readSession()?.user.email).toBe('baru@mail.com'))
    expect(await screen.findByText('Katalog unit')).toBeInTheDocument()
  })

  it('menolak pendaftaran bila NIK bukan 16 digit', async () => {
    renderDaftar()

    await isiFormulir('baru@mail.com')
    await userEvent.clear(screen.getByLabelText('NIK'))
    await userEvent.type(screen.getByLabelText('NIK'), '123')
    await userEvent.click(screen.getByRole('button', { name: 'Daftar Sekarang' }))

    expect(await screen.findByText('NIK harus 16 digit.')).toBeInTheDocument()
    expect(readSession()).toBeNull()
  })
})

describe('BantuanPage', () => {
  it('menyediakan kanal Instagram dan WhatsApp', () => {
    renderWithProviders(<BantuanPage />)

    expect(screen.getByRole('link', { name: /@Aditiya.wibisono/ })).toHaveAttribute('href', 'https://instagram.com/Aditiya.wibisono')
    expect(screen.getByRole('link', { name: /\+62 851-8998-9912/ })).toHaveAttribute('href', 'https://wa.me/6285189989912')
  })
})
