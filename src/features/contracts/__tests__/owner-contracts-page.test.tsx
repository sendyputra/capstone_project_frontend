import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { OwnerContractsPage } from '@/features/contracts/pages/owner-contracts-page'
import { pantauMetode } from '@/test/metode'
import { masukSebagai } from '@/test/sesi'
import { renderWithProviders } from '@/test/render'

describe('OwnerContractsPage', () => {
  it('menampilkan kontrak dan menyetujui yang masih menunggu', async () => {
    masukSebagai(402, 'pemilik', 'Pak Wahyu')
    renderWithProviders(<OwnerContractsPage />)

    const baris = (await screen.findAllByText('Siti Sarah'))
      .map((el) => el.closest('tr')!)
      .find((tr) => within(tr).queryByRole('button', { name: 'Setujui' }))!

    await userEvent.click(within(baris).getByRole('button', { name: 'Setujui' }))
    expect(await within(baris).findByText('Aktif')).toBeInTheDocument()
  })

  /* Verifikasi KTP dulu ada di panel admin yang sudah dihapus; pemilik sekarang
     melihatnya sebagai kolom di daftar kontraknya sendiri. */
  it('menampilkan kolom KTP berisi status verifikasi penyewa', async () => {
    masukSebagai(402, 'pemilik', 'Pak Wahyu')
    renderWithProviders(<OwnerContractsPage />)

    expect(await screen.findByRole('columnheader', { name: 'KTP' })).toBeInTheDocument()

    const baris = (await screen.findAllByText('Siti Sarah'))
      .map((el) => el.closest('tr')!)
      .find((tr) => within(tr).queryByRole('button', { name: 'Setujui' }))!
    expect(within(baris).getByText('Terverifikasi')).toBeInTheDocument()
  })

  /* Mock menerima PATCH maupun PUT, jadi tanpa kunci ini adaptor boleh kembali
     mengirim PATCH dan produksi membalas 405 tanpa satu tes pun merah. */
  it('mengirim perubahan status kontrak dengan PUT', async () => {
    masukSebagai(402, 'pemilik', 'Pak Wahyu')
    const rekaman = pantauMetode()
    renderWithProviders(<OwnerContractsPage />)

    const baris = (await screen.findAllByText('Siti Sarah'))
      .map((el) => el.closest('tr')!)
      .find((tr) => within(tr).queryByRole('button', { name: 'Setujui' }))!

    await userEvent.click(within(baris).getByRole('button', { name: 'Setujui' }))
    await within(baris).findByText('Aktif')

    expect(rekaman).toContainEqual(expect.stringMatching(/^PUT \/contracts\/\d+$/))
    expect(rekaman.filter((permintaan) => permintaan.startsWith('PATCH'))).toEqual([])
  })
})
