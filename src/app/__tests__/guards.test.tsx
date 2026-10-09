import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { RequireRole } from '@/app/guards'
import { writeSession } from '@/features/auth/session'
import { renderWithProviders } from '@/test/render'

function renderDenganPenjaga(peran: 'pemilik' | 'penyewa') {
  writeSession({ token: 'mock.abc.tanda', user: { id: 402, name: 'Pak Wahyu', email: 'wahyu@umkm.id', role: peran } })
  return renderWithProviders(
    <MemoryRouter initialEntries={['/pemilik/unit']}>
      <Routes>
        <Route path="/masuk" element={<p>Layar masuk</p>} />
        <Route path="/403" element={<p>Tidak diizinkan</p>} />
        <Route
          path="/pemilik/unit"
          element={
            <RequireRole role="pemilik">
              <p>Daftar unit</p>
            </RequireRole>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireRole', () => {
  it('mengantar ke layar masuk bila belum ada sesi', async () => {
    localStorage.clear()
    renderWithProviders(
      <MemoryRouter initialEntries={['/pemilik/unit']}>
        <Routes>
          <Route path="/masuk" element={<p>Layar masuk</p>} />
          <Route path="/pemilik/unit" element={<RequireRole role="pemilik"><p>Daftar unit</p></RequireRole>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Layar masuk')).toBeInTheDocument()
  })

  it('mengantar ke 403 bila peran tidak cocok', async () => {
    renderDenganPenjaga('penyewa')
    expect(await screen.findByText('Tidak diizinkan')).toBeInTheDocument()
  })

  it('menampilkan isi bila peran cocok', async () => {
    renderDenganPenjaga('pemilik')
    await waitFor(() => expect(screen.getByText('Daftar unit')).toBeInTheDocument())
  })

  it('sesi kedaluwarsa saat aplikasi terbuka diantar kembali ke layar masuk', async () => {
    const { server } = await import('@/api/mocks/server')
    const { http, HttpResponse } = await import('msw')
    server.use(http.get('/auth/me', () => HttpResponse.json({ message: 'Sesi tidak sah.' }, { status: 401 })))
    renderDenganPenjaga('pemilik')
    expect(await screen.findByText('Layar masuk')).toBeInTheDocument()
  })
})
