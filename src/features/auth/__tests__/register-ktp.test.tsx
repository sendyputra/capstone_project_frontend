import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/auth/ocr/bacaKtp', () => ({
  bacaKtp: async () => ({ nik: '3578123456780001', nama: 'BUDI SANTOSO', yakin: true }),
}))

import { RegisterPage } from '@/features/auth/pages/register-page'
import { server } from '@/api/mocks/server'
import { renderWithProviders } from '@/test/render'

/* `MemoryRouter` ditambahkan di luar brief: halaman pendaftaran memakai
   `useNavigate`/`Link`, jadi tanpa router tes gagal karena konteks, bukan karena
   pengiriman multipart yang sedang diuji. */
function renderDaftar() {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/daftar']}>
      <RegisterPage />
    </MemoryRouter>,
  )
}

describe('pendaftaran multipart', () => {
  it('mengirim berkas KTP bersama isian identitas', async () => {
    let badan: FormData | null = null
    server.use(
      http.post('/register', async ({ request }) => {
        badan = await request.formData()
        return HttpResponse.json(
          { data: { token: 't', user: { id: 9, name: 'Budi', email: 'budi@mail.com', role: 'penyewa' } } },
          { status: 201 },
        )
      }),
    )
    renderDaftar()
    await userEvent.type(screen.getByLabelText('Nama lengkap'), 'Budi Santoso')
    await userEvent.type(screen.getByLabelText('NIK'), '3578123456780001')
    await userEvent.type(screen.getByLabelText('Email / Nomor WhatsApp'), 'budi@mail.com')
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123')
    await userEvent.type(screen.getByLabelText('Ulangi kata sandi'), 'rahasia123')
    await userEvent.upload(screen.getByLabelText('Berkas KTP'), new File(['x'], 'ktp.png', { type: 'image/png' }))
    await userEvent.click(screen.getByRole('button', { name: 'Daftar Sekarang' }))

    await waitFor(() => expect(badan).not.toBeNull())
    expect(badan!.get('nik')).toBe('3578123456780001')
    expect(badan!.get('role')).toBe('penyewa')

    /* `instanceof File` tidak bisa dipakai di sini: `src/test/setup.ts` menyalin
       badan multipart ke kelas `File` milik Node selama permintaan (jsdom memakai
       realm lain), jadi bagian berkas yang sah pun bukan turunan `File` jsdom.
       Merek di bawah ini sama kuatnya dan tidak bergantung realm: bagian teks
       bernilai string, sedangkan bagian berkas ber-merek `[object File]`. */
    const ktp = badan!.get('ktp')
    expect(typeof ktp).not.toBe('string')
    expect(Object.prototype.toString.call(ktp)).toBe('[object File]')
    expect({ name: (ktp as File).name, type: (ktp as File).type }).toEqual({ name: 'ktp.png', type: 'image/png' })
    /* Isian lain ikut terkirim, bukan hanya berkasnya. Nama yang terkirim adalah
       hasil OCR (`BUDI SANTOSO`), yang menimpa ketikan — perilaku Task 11. */
    expect(badan!.get('name')).toBe('BUDI SANTOSO')
    expect(badan!.get('password_confirmation')).toBe('rahasia123')
  })

  /* Berkas KTP wajib ada; penolakannya di peramban, tanpa perjalanan ke server. */
  it('menolak mendaftar tanpa berkas KTP tanpa menghubungi server', async () => {
    let dipanggil = false
    server.use(
      http.post('/register', () => {
        dipanggil = true
        return HttpResponse.json({ data: { token: 't', user: { id: 9, name: 'Budi', email: 'budi@mail.com', role: 'penyewa' } } }, { status: 201 })
      }),
    )
    renderDaftar()
    await userEvent.type(screen.getByLabelText('Nama lengkap'), 'Budi Santoso')
    await userEvent.type(screen.getByLabelText('NIK'), '3578123456780001')
    await userEvent.type(screen.getByLabelText('Email / Nomor WhatsApp'), 'budi@mail.com')
    await userEvent.type(screen.getByLabelText('Kata sandi'), 'rahasia123')
    await userEvent.type(screen.getByLabelText('Ulangi kata sandi'), 'rahasia123')
    await userEvent.click(screen.getByRole('button', { name: 'Daftar Sekarang' }))

    expect(await screen.findByText('Berkas KTP wajib diunggah.')).toBeInTheDocument()
    expect(dipanggil).toBe(false)
  })
})
