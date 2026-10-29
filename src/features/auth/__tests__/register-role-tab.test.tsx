import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi, afterEach } from 'vitest'

vi.mock('@/features/auth/ocr/bacaKtp', () => ({
  bacaKtp: async () => ({ nik: '3578123456780001', nama: 'BUDI SANTOSO', yakin: true }),
}))

import { RegisterPage } from '@/features/auth/pages/register-page'
import { server } from '@/api/mocks/server'
import { renderWithProviders } from '@/test/render'

const jawaban = { data: { token: 't', user: { id: 9, name: 'Budi', email: 'budi@mail.com', role: 'penyewa' } } }

function renderDaftar() {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/daftar']}>
      <RegisterPage />
    </MemoryRouter>,
  )
}

/* Halaman ini menulis `data-role` di <html>; tanpa pembersihan, tes berikutnya
   mewarisi nilai dari tes sebelumnya dan lolos palsu. */
afterEach(() => {
  delete document.documentElement.dataset.role
})

/* Badan multipart terakhir yang sampai ke server; `null` selama belum ada. */
function tangkapBadan() {
  const kotak: { badan: FormData | null } = { badan: null }
  server.use(
    http.post('/register', async ({ request }) => {
      kotak.badan = await request.formData()
      return HttpResponse.json(jawaban, { status: 201 })
    }),
  )
  return kotak
}

async function isiForm() {
  await userEvent.type(screen.getByLabelText('Nama lengkap'), 'Budi Santoso')
  await userEvent.type(screen.getByLabelText('NIK'), '3578123456780001')
  await userEvent.type(screen.getByLabelText('Email / Nomor WhatsApp'), 'budi@mail.com')
  await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123')
  await userEvent.type(screen.getByLabelText('Ulangi kata sandi'), 'rahasia123')
  await userEvent.upload(screen.getByLabelText('Berkas KTP'), new File(['x'], 'ktp.png', { type: 'image/png' }))
}

describe('tab peran pada pendaftaran', () => {
  it('memilih Penyewa sebagai tab awal dan mengirim role=tenant', async () => {
    const kotak = tangkapBadan()
    renderDaftar()

    expect(screen.getByRole('button', { name: 'Penyewa' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Pemilik' })).toHaveAttribute('aria-pressed', 'false')

    await isiForm()
    await userEvent.click(screen.getByRole('button', { name: 'Daftar Sekarang' }))

    await waitFor(() => expect(kotak.badan).not.toBeNull())
    expect(kotak.badan!.get('role')).toBe('tenant')
  })

  it('mengirim role=owner setelah tab Pemilik dipilih', async () => {
    const kotak = tangkapBadan()
    renderDaftar()

    await userEvent.click(screen.getByRole('button', { name: 'Pemilik' }))
    expect(screen.getByText(/kelola unit, kontrak, dan tagihan/i)).toBeInTheDocument()

    await isiForm()
    await userEvent.click(screen.getByRole('button', { name: 'Daftar Sekarang' }))

    await waitFor(() => expect(kotak.badan).not.toBeNull())
    expect(kotak.badan!.get('role')).toBe('owner')
  })

  it('menandai tab aktif lewat aria-pressed dan memindahkannya saat diklik', async () => {
    renderDaftar()

    await userEvent.click(screen.getByRole('button', { name: 'Pemilik' }))
    expect(screen.getByRole('button', { name: 'Pemilik' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Penyewa' })).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(screen.getByRole('button', { name: 'Penyewa' }))
    expect(screen.getByRole('button', { name: 'Penyewa' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Pemilik' })).toHaveAttribute('aria-pressed', 'false')
  })

  /* Aksen peran dipasang pada pembungkus halaman, bukan di <html>: atribut di
     <html> milik AppShell (identitas sesi), dan token tema gelap mengenali
     `[data-theme='dark'] [data-role='owner']` untuk wilayah bersarang. */
  it('memasang data-role pada pembungkus halaman dan tidak menyentuh <html>', async () => {
    renderDaftar()
    await userEvent.click(screen.getByRole('button', { name: 'Pemilik' }))

    expect(document.querySelector('[data-role="owner"]')).not.toBeNull()
    expect(document.documentElement.dataset.role).toBeUndefined()
  })
})
