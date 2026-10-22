import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const bacaKtp = vi.fn()
vi.mock('@/features/auth/ocr/bacaKtp', () => ({ bacaKtp: (...args: unknown[]) => bacaKtp(...args) }))

import { RegisterPage } from '@/features/auth/pages/register-page'
import { renderWithProviders } from '@/test/render'

const berkas = new File(['x'], 'ktp.png', { type: 'image/png' })

function renderHalaman() {
  return renderWithProviders(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  )
}

describe('pendaftaran dengan OCR', () => {
  beforeEach(() => bacaKtp.mockReset())

  it('mengisi NIK dan nama saat OCR berhasil', async () => {
    bacaKtp.mockResolvedValue({ nik: '3578123456780001', nama: 'BUDI SANTOSO', yakin: true })
    renderHalaman()
    await userEvent.upload(screen.getByLabelText('Berkas KTP'), berkas)
    expect(await screen.findByLabelText('NIK')).toHaveValue('3578123456780001')
    expect(screen.getByLabelText('Nama lengkap')).toHaveValue('BUDI SANTOSO')
  })

  it('membuka isian manual saat OCR tidak yakin', async () => {
    bacaKtp.mockResolvedValue({ nik: '', nama: '', yakin: false })
    renderHalaman()
    await userEvent.upload(screen.getByLabelText('Berkas KTP'), berkas)
    expect(await screen.findByText(/tidak terbaca/i)).toBeInTheDocument()
    expect(screen.getByLabelText('NIK')).toBeEnabled()
  })
})
