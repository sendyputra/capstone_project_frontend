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
    /* Toast memakai label bulan yang sama dengan tabel, bukan `YYYY-MM`. */
    expect(await screen.findByText(/Tagihan November 2026 ditandai lunas/)).toBeInTheDocument()
  })

  /* DTO backend mengirim `month: '2026-09'` dan `proof_url` berupa jalur berkas.
     Halaman pemilik harus menampilkan label bulan dan nama berkas, seperti
     halaman tagihan penyewa — bukan nilai mentahnya. */
  it('menampilkan label bulan dan nama berkas bukti', async () => {
    masukSebagai(402, 'pemilik', 'Pak Wahyu')
    renderWithProviders(<OwnerPaymentsPage />)

    const baris = (await screen.findAllByText('Tagihan September 2026'))
      .map((el) => el.closest('tr')!)
      .find((tr) => within(tr).queryByText('bukti-transfer-201-sep.jpg'))!
    expect(within(baris).getByText('bukti-transfer-201-sep.jpg')).toBeInTheDocument()
    expect(screen.queryByText(/2026-09/)).not.toBeInTheDocument()
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
