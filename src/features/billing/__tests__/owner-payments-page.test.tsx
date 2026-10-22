import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { OwnerPaymentsPage } from '@/features/billing/pages/owner-payments-page'
import { pantauMetode } from '@/test/metode'
import { masukSebagai } from '@/test/sesi'
import { renderWithProviders } from '@/test/render'

describe('OwnerPaymentsPage', () => {
  it('menyetujui bukti bayar yang menunggu verifikasi', async () => {
    masukSebagai(402, 'pemilik', 'Pak Wahyu')
    renderWithProviders(<OwnerPaymentsPage />)

    const baris = (await screen.findAllByText('Siti Sarah'))
      .map((el) => el.closest('tr')!)
      .find((tr) => within(tr).queryByRole('button', { name: 'Setujui' }))!

    await userEvent.click(within(baris).getByRole('button', { name: 'Setujui' }))
    expect(await within(baris).findByText('Lunas')).toBeInTheDocument()
  })

  /* Mock menerima PATCH maupun PUT, jadi tanpa kunci ini adaptor boleh kembali
     mengirim PATCH dan produksi membalas 405 tanpa satu tes pun merah. */
  it('mengirim verifikasi pembayaran dengan PUT', async () => {
    masukSebagai(402, 'pemilik', 'Pak Wahyu')
    const rekaman = pantauMetode()
    renderWithProviders(<OwnerPaymentsPage />)

    const baris = (await screen.findAllByText('Siti Sarah'))
      .map((el) => el.closest('tr')!)
      .find((tr) => within(tr).queryByRole('button', { name: 'Setujui' }))!

    await userEvent.click(within(baris).getByRole('button', { name: 'Setujui' }))
    await within(baris).findByText('Lunas')

    expect(rekaman).toContainEqual(expect.stringMatching(/^PUT \/payments\/\d+$/))
    expect(rekaman.filter((permintaan) => permintaan.startsWith('PATCH'))).toEqual([])
  })
})
