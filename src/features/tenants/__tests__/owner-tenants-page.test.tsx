import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/api/mocks/server'
import { OwnerTenantsPage } from '@/features/tenants/pages/owner-tenants-page'
import { pantauMetode } from '@/test/metode'
import { masukSebagai } from '@/test/sesi'
import { renderWithProviders } from '@/test/render'

function renderHalaman() {
  masukSebagai(402, 'pemilik', 'Pak Wahyu')
  return renderWithProviders(<OwnerTenantsPage />)
}

function baris(nama: string): HTMLElement {
  return screen.getByText(nama).closest('tr')!
}

describe('OwnerTenantsPage', () => {
  it('menampilkan penyewa milik pemilik', async () => {
    renderHalaman()

    expect(await screen.findByRole('columnheader', { name: 'Jumlah Kontrak' })).toBeInTheDocument()
    expect(await screen.findByText('Rian Pratama')).toBeInTheDocument()
    /* Rian dibuat pemilik dan belum punya kontrak; Siti tertaut lewat dua
       kontraknya pada unit Pak Wahyu. */
    expect(within(baris('Rian Pratama')).getByText('0')).toBeInTheDocument()
    expect(within(baris('Siti Sarah')).getByText('2')).toBeInTheDocument()
    expect(screen.queryByText('Dewi Lestari')).not.toBeInTheDocument()
  })

  it('menambah penyewa tanpa akun', async () => {
    const rekaman = pantauMetode()
    renderHalaman()
    await screen.findByText('Rian Pratama')

    await userEvent.type(screen.getByLabelText('Nama'), 'Budi Santoso')
    await userEvent.type(screen.getByLabelText('Telepon'), '628111222333')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Penyewa' }))

    expect(await screen.findByText('Budi Santoso')).toBeInTheDocument()
    expect(rekaman).toContain('POST /tenants')
  })

  it('mengubah status KTP', async () => {
    const rekaman = pantauMetode()
    renderHalaman()
    await screen.findByText('Rian Pratama')

    await userEvent.click(within(baris('Rian Pratama')).getByRole('button', { name: 'Ubah' }))
    await userEvent.selectOptions(screen.getByLabelText('KTP'), 'Terverifikasi')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Penyewa' }))

    await waitFor(() => expect(within(baris('Rian Pratama')).getByText('Terverifikasi')).toBeInTheDocument())
    expect(rekaman).toContain('PUT /tenants/1')
  })

  it('menghapus penyewa tanpa kontrak', async () => {
    const rekaman = pantauMetode()
    renderHalaman()
    await screen.findByText('Rian Pratama')

    await userEvent.click(within(baris('Rian Pratama')).getByRole('button', { name: 'Hapus' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Hapus penyewa' }))

    await waitFor(() => expect(screen.queryByText('Rian Pratama')).not.toBeInTheDocument())
    expect(rekaman).toContain('DELETE /tenants/1')
  })

  /* Balapan antara daftar dan hapus: server bisa melaporkan nol kontrak saat
     daftar dimuat, lalu menolak hapus karena kontrak baru masuk. Pesannya harus
     sampai ke layar, bukan ditelan diam-diam. */
  it('menampilkan galat 409 saat penyewa punya kontrak', async () => {
    server.use(
      http.get('/tenants', () =>
        HttpResponse.json({
          data: [{ id: 2, user_id: 405, owner_id: null, name: 'Siti Sarah', phone: '628987654321', ktp_status: 'verified', contracts_count: 0, created_at: '2026-10-03T00:00:00Z' }],
        }),
      ),
      http.delete('/tenants/2', () =>
        HttpResponse.json({ message: 'Penyewa yang memiliki kontrak tidak dapat dihapus.' }, { status: 409 }),
      ),
    )
    renderHalaman()
    await screen.findByText('Siti Sarah')

    await userEvent.click(within(baris('Siti Sarah')).getByRole('button', { name: 'Hapus' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Hapus penyewa' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('memiliki kontrak')
  })

  it('menyembunyikan tombol hapus untuk penyewa dengan kontrak', async () => {
    renderHalaman()
    await screen.findByText('Siti Sarah')

    expect(within(baris('Siti Sarah')).queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument()
    expect(within(baris('Rian Pratama')).getByRole('button', { name: 'Hapus' })).toBeInTheDocument()
  })
})
