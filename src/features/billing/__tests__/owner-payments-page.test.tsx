import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { server } from '@/api/mocks/server'
import { OwnerPaymentsPage } from '@/features/billing/pages/owner-payments-page'
import { pantauMetode } from '@/test/metode'
import { masukSebagai } from '@/test/sesi'
import { stubUnduhan } from '@/test/unduh'
import { renderWithProviders } from '@/test/render'

/* Pencatatan manual harus mengirim JSON, bukan `FormData`; rekaman badan
   membuktikan bentuk yang benar-benar pergi ke server. */
function pantauBadan(): { metode: string; badan: unknown }[] {
  const rekaman: { metode: string; badan: unknown }[] = []
  const asli = globalThis.fetch
  const pantau = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    if (typeof init?.body === 'string') rekaman.push({ metode: init.method ?? 'GET', badan: JSON.parse(init.body) })
    return asli(input, init)
  })
  onTestFinished(() => pantau.mockRestore())
  return rekaman
}

async function bukaFormPembayaran() {
  masukSebagai(402, 'pemilik', 'Pak Wahyu')
  renderWithProviders(<OwnerPaymentsPage />)
  await screen.findAllByText('Siti Sarah')
  await userEvent.click(screen.getByRole('button', { name: 'Catat Pembayaran' }))
}

describe('OwnerPaymentsPage', () => {
  it('menyetujui bukti bayar yang menunggu verifikasi', async () => {
    masukSebagai(402, 'pemilik', 'Pak Wahyu')
    renderWithProviders(<OwnerPaymentsPage />)

    const baris = (await screen.findAllByText('Siti Sarah'))
      .map((el) => el.closest('tr')!)
      .find((tr) => within(tr).queryByRole('button', { name: 'Setujui' }))!

    await userEvent.click(within(baris).getByRole('button', { name: 'Setujui' }))
    expect(await within(baris).findByText('Lunas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unduh CSV' })).toBeInTheDocument()
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

  it('membuka form catat pembayaran', async () => {
    await bukaFormPembayaran()

    expect(screen.getByLabelText('Kontrak')).toBeInTheDocument()
    expect(screen.getByLabelText('Bulan')).toBeInTheDocument()
    expect(screen.getByLabelText('Jumlah')).toBeInTheDocument()
  })

  /* Kontrak 201 sudah lunas untuk September; yang boleh dicatat hanya bulan
     yang belum punya pembayaran berstatus lunas atau menunggu verifikasi. */
  it('hanya menawarkan bulan yang belum dibayar', async () => {
    await bukaFormPembayaran()
    await userEvent.selectOptions(screen.getByLabelText('Kontrak'), '201')

    const bulan = screen.getByLabelText('Bulan')
    expect(within(bulan).getByRole('option', { name: 'Oktober 2026' })).toBeInTheDocument()
    expect(within(bulan).queryByRole('option', { name: 'September 2026' })).not.toBeInTheDocument()
  })

  it('mengisi jumlah dari biaya bulanan kontrak', async () => {
    await bukaFormPembayaran()
    await userEvent.selectOptions(screen.getByLabelText('Kontrak'), '201')

    expect(screen.getByLabelText('Jumlah')).toHaveValue(2_500_000)
  })

  it('mengirim JSON tanpa berkas', async () => {
    const rekaman = pantauBadan()
    await bukaFormPembayaran()
    await userEvent.selectOptions(screen.getByLabelText('Kontrak'), '201')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Pembayaran' }))

    await waitFor(() => expect(rekaman.some((permintaan) => permintaan.metode === 'POST')).toBe(true))
    expect(rekaman.find((permintaan) => permintaan.metode === 'POST')!.badan).toEqual({
      contract_id: 201,
      month: '2026-10',
      amount: 2_500_000,
    })
  })

  it('menampilkan galat 409 saat bulan sudah dibayar', async () => {
    server.use(
      http.post('/payments', () =>
        HttpResponse.json({ message: 'Bulan ini sudah memiliki pembayaran.' }, { status: 409 }),
      ),
    )
    await bukaFormPembayaran()
    await userEvent.selectOptions(screen.getByLabelText('Kontrak'), '201')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Pembayaran' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('sudah memiliki pembayaran')
  })

  it('baris baru tampil Lunas', async () => {
    await bukaFormPembayaran()
    await userEvent.selectOptions(screen.getByLabelText('Kontrak'), '201')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Pembayaran' }))

    const baris = (await screen.findAllByText('Tagihan Oktober 2026'))
      .map((el) => el.closest('tr'))
      .find((tr) => Boolean(tr && within(tr).queryByText('Siti Sarah')))!
    expect(within(baris).getByText('Lunas')).toBeInTheDocument()
  })

  it('mengunduh laporan tagihan dari server, bukan menyusun di peramban', async () => {
    masukSebagai(402, 'pemilik', 'Pak Wahyu')
    renderWithProviders(<OwnerPaymentsPage />)
    const rekaman = pantauMetode()
    const unduh = stubUnduhan()
    await screen.findAllByText('Siti Sarah')

    await userEvent.click(screen.getByRole('button', { name: 'Unduh CSV' }))

    await waitFor(() => expect(rekaman).toContain('GET /payments/export'))
    await waitFor(() => expect(unduh.nama[0]).toMatch(/^laporan-tagihan-\d{8}\.csv$/))
  })
})
