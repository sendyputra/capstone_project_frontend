import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { LoncengNotifikasi } from '@/features/notifications/components/lonceng-notifikasi'
import { pantauMetode } from '@/test/metode'
import { masukSebagai } from '@/test/sesi'
import { renderWithProviders } from '@/test/render'

function renderLonceng() {
  masukSebagai(405, 'penyewa', 'Siti Sarah')
  return renderWithProviders(<LoncengNotifikasi />)
}

describe('LoncengNotifikasi', () => {
  it('menampilkan badge jumlah belum dibaca', async () => {
    renderLonceng()

    const tombol = await screen.findByRole('button', { name: 'Notifikasi' })
    expect(await within(tombol).findByText('2')).toBeInTheDocument()
  })

  it('membuka panel dan menampilkan pesan notifikasi', async () => {
    renderLonceng()

    await userEvent.click(await screen.findByRole('button', { name: 'Notifikasi' }))

    const panel = await screen.findByRole('dialog', { name: 'Notifikasi' })
    expect(within(panel).getByText(/Tagihan November 2026/)).toBeInTheDocument()
  })

  it('menandai satu notifikasi dibaca saat barisnya diklik', async () => {
    const rekaman = pantauMetode()
    renderLonceng()
    await userEvent.click(await screen.findByRole('button', { name: 'Notifikasi' }))

    const panel = await screen.findByRole('dialog', { name: 'Notifikasi' })
    await userEvent.click(within(panel).getByRole('button', { name: /Tagihan November 2026/ }))

    await waitFor(() => expect(rekaman).toContain('POST /notifications/n-405-1/read'))
    const tombol = screen.getByRole('button', { name: 'Notifikasi' })
    await waitFor(() => expect(within(tombol).getByText('1')).toBeInTheDocument())
  })

  it('menandai semua dibaca', async () => {
    const rekaman = pantauMetode()
    renderLonceng()
    await userEvent.click(await screen.findByRole('button', { name: 'Notifikasi' }))

    const panel = await screen.findByRole('dialog', { name: 'Notifikasi' })
    await userEvent.click(within(panel).getByRole('button', { name: 'Tandai semua dibaca' }))

    await waitFor(() => expect(rekaman).toContain('POST /notifications/read-all'))
    const tombol = screen.getByRole('button', { name: 'Notifikasi' })
    await waitFor(() => expect(within(tombol).queryByText('2')).not.toBeInTheDocument())
  })

  /* Tanpa sesi tidak ada yang boleh diminta: lonceng tamu hanya tombol mati. */
  it('tidak memanggil API saat tamu', async () => {
    const rekaman = pantauMetode()
    renderWithProviders(<LoncengNotifikasi />)

    await userEvent.click(await screen.findByRole('button', { name: 'Notifikasi' }))
    await screen.findByRole('dialog', { name: 'Notifikasi' })

    expect(rekaman.filter((permintaan) => permintaan.includes('/notifications'))).toEqual([])
  })
})
