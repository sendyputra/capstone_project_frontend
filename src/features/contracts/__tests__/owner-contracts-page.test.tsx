import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/api/mocks/server'
import { OwnerContractsPage } from '@/features/contracts/pages/owner-contracts-page'
import { pantauMetode } from '@/test/metode'
import { masukSebagai } from '@/test/sesi'
import { stubUnduhan } from '@/test/unduh'
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
    expect(screen.getByRole('button', { name: 'Unduh CSV' })).toBeInTheDocument()
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

  /* Spec §5: pemilik melihat kontrak yang menunggu lebih dulu. Tanpa urutan
     ini, kontrak `Aktif` dari data contoh menutupi pekerjaan yang sebenarnya
     menunggu keputusan. */
  it('menampilkan kontrak Menunggu pada baris pertama', async () => {
    masukSebagai(402, 'pemilik', 'Pak Wahyu')
    renderWithProviders(<OwnerContractsPage />)

    const tabel = await screen.findByRole('table')
    /* Baris 0 adalah kepala tabel; baris 1 baris data pertama. */
    const barisPertama = within(tabel).getAllByRole('row')[1]
    expect(within(barisPertama).getByText('Menunggu')).toBeInTheDocument()
    expect(within(barisPertama).getByRole('button', { name: 'Setujui' })).toBeInTheDocument()
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

  /* `GET /contracts` tanpa parameter hanya mengembalikan kontrak aktif, jadi
     kontrak `Menunggu` dan `Selesai` hilang dari layar pemilik. */
  it('meminta semua status kontrak, bukan hanya yang aktif', async () => {
    masukSebagai(402, 'pemilik', 'Pak Wahyu')
    const rekaman = pantauMetode()
    renderWithProviders(<OwnerContractsPage />)
    await screen.findAllByText('Siti Sarah')

    expect(rekaman).toContain('GET /contracts?status=all')
  })

  it('mengunduh laporan kontrak dari server', async () => {
    masukSebagai(402, 'pemilik', 'Pak Wahyu')
    renderWithProviders(<OwnerContractsPage />)
    const rekaman = pantauMetode()
    const unduh = stubUnduhan()
    await screen.findAllByText('Siti Sarah')

    await userEvent.click(screen.getByRole('button', { name: 'Unduh CSV' }))

    await waitFor(() => expect(rekaman).toContain('GET /contracts/export'))
    await waitFor(() => expect(unduh.nama[0]).toMatch(/^laporan-kontrak-\d{8}\.csv$/))
  })

  it('menampilkan pesan galat saat unduhan kontrak gagal', async () => {
    server.use(
      http.get('/contracts/export', () => HttpResponse.json({ message: 'Laporan gagal dibuat.' }, { status: 500 })),
    )
    masukSebagai(402, 'pemilik', 'Pak Wahyu')
    renderWithProviders(<OwnerContractsPage />)
    await screen.findAllByText('Siti Sarah')

    await userEvent.click(screen.getByRole('button', { name: 'Unduh CSV' }))

    expect(await screen.findByText('Laporan gagal dibuat.')).toBeInTheDocument()
  })
})
