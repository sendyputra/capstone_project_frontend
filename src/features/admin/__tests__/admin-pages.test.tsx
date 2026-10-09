import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AdminShell } from '@/features/admin/layouts/admin-shell'
import { AdminUnitPage } from '@/features/admin/pages/admin-unit-page'
import { AdminKontrakPage } from '@/features/admin/pages/admin-kontrak-page'
import { AdminPembayaranPage } from '@/features/admin/pages/admin-pembayaran-page'
import { AdminPenggunaPage } from '@/features/admin/pages/admin-pengguna-page'
import { masukSebagai } from '@/test/sesi'
import { renderWithProviders } from '@/test/render'

function renderAdmin(awal: string) {
  masukSebagai(401, 'admin', 'Admin Nusantara')
  const router = createMemoryRouter(
    [
      {
        element: <AdminShell />,
        children: [
          { path: '/admin/unit', element: <AdminUnitPage /> },
          { path: '/admin/kontrak', element: <AdminKontrakPage /> },
          { path: '/admin/pembayaran', element: <AdminPembayaranPage /> },
          { path: '/admin/pengguna', element: <AdminPenggunaPage /> },
        ],
      },
    ],
    { initialEntries: [awal] },
  )
  return renderWithProviders(<RouterProvider router={router} />)
}

describe('AdminShell', () => {
  it('menyapa admin dan menampilkan empat angka lintas pemilik', async () => {
    renderAdmin('/admin/unit')

    expect(await screen.findByRole('heading', { name: 'Selamat Datang, Admin!' })).toBeInTheDocument()
    expect(await screen.findByText('Total Unit Lintas Pemilik')).toBeInTheDocument()
    expect(screen.getByText('5 Unit')).toBeInTheDocument()
    expect(screen.getByText('2 Kontrak')).toBeInTheDocument()
    expect(screen.getByText('1 Bukti')).toBeInTheDocument()
    expect(screen.getByText('5 Akun')).toBeInTheDocument()
  })
})

describe('AdminUnitPage', () => {
  it('menampilkan unit lintas pemilik beserta pemiliknya', async () => {
    renderAdmin('/admin/unit')

    expect(await screen.findByText('Kos Kamar 01')).toBeInTheDocument()
    expect(screen.getByText('Kos Putri Melati Kamar B2')).toBeInTheDocument()
    expect(screen.getAllByText('Pak Wahyu').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bu Rina').length).toBeGreaterThan(0)
  })
})

describe('AdminKontrakPage', () => {
  it('menyelesaikan kontrak aktif', async () => {
    renderAdmin('/admin/kontrak')
    const baris = (await screen.findByText('Siti Sarah')).closest('tr')!

    await userEvent.click(within(baris).getByRole('button', { name: 'Selesaikan' }))
    await waitFor(() => expect(within(baris).getByText('Selesai')).toBeInTheDocument())
  })
})

describe('AdminPembayaranPage', () => {
  async function barisMenunggu() {
    const baris = (await screen.findAllByText('Dewi Lestari')).map((el) => el.closest('tr')!)
    return baris.find((tr) => within(tr).queryByText('Menunggu Verifikasi'))!
  }

  it('menyetujui bukti bayar menunggu verifikasi', async () => {
    renderAdmin('/admin/pembayaran')
    const baris = await barisMenunggu()

    await userEvent.click(within(baris).getByRole('button', { name: 'Setujui' }))
    await waitFor(() => expect(within(baris).getByText('Lunas')).toBeInTheDocument())
  })

  it('menolak bukti bayar setelah dikonfirmasi', async () => {
    renderAdmin('/admin/pembayaran')
    const baris = await barisMenunggu()

    await userEvent.click(within(baris).getByRole('button', { name: 'Tolak' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Tolak bukti' }))
    await waitFor(() => expect(within(baris).getByText('Ditolak')).toBeInTheDocument())
  })
})

describe('AdminPenggunaPage', () => {
  it('mengubah peran pengguna', async () => {
    renderAdmin('/admin/pengguna')
    const baris = (await screen.findByText('Siti Sarah')).closest('tr')!

    await userEvent.selectOptions(within(baris).getByLabelText('Peran Siti Sarah'), 'pemilik')
    await waitFor(() => expect((within(baris).getByLabelText('Peran Siti Sarah') as HTMLSelectElement).value).toBe('pemilik'))
  })

  it('menghapus pengguna lain lewat konfirmasi, dan melindungi akun sendiri', async () => {
    renderAdmin('/admin/pengguna')
    await screen.findByText('Rian Pratama')
    expect(screen.getAllByText('Tidak dapat dihapus').length).toBeGreaterThan(0)

    const baris = screen.getByText('Rian Pratama').closest('tr')!
    await userEvent.click(within(baris).getByRole('button', { name: /Hapus akun/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Hapus akun' }))
    await waitFor(() => expect(screen.queryByText('Rian Pratama')).not.toBeInTheDocument())
  })
})
