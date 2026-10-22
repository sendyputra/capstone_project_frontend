import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { OwnerContractsPage } from '@/features/contracts/pages/owner-contracts-page'
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
})
