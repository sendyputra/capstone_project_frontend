import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TautanBukti } from '@/features/billing/tautan-bukti'

/* `proof_url` dari API asli adalah URL absolut. Data demo mengirim nama berkas
   saja, dan unggahan demo berupa data URL — hanya yang benar-benar bisa dibuka
   yang menjadi tautan. */
describe('TautanBukti', () => {
  it('menautkan berkas absolut ke tab baru', () => {
    render(<TautanBukti url="https://api.example.com/uploads/payments/bukti-okt.jpg" />)

    const tautan = screen.getByRole('link', { name: 'bukti-okt.jpg' })
    expect(tautan).toHaveAttribute('href', 'https://api.example.com/uploads/payments/bukti-okt.jpg')
    expect(tautan).toHaveAttribute('target', '_blank')
    expect(tautan).toHaveAttribute('rel', 'noreferrer')
  })

  it('menampilkan nama berkas tanpa tautan bila bukan URL yang bisa dibuka', () => {
    render(<TautanBukti url="bukti-transfer-201-sep.jpg" />)

    expect(screen.getByText('bukti-transfer-201-sep.jpg')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('memberi label pendek untuk unggahan demo berbentuk data URL', () => {
    render(<TautanBukti url="data:image/png;base64,iVBORw0KGgo=" />)

    expect(screen.getByRole('link', { name: 'Bukti bayar' })).toBeInTheDocument()
  })

  it('menulis "Belum ada berkas" saat kosong', () => {
    render(<TautanBukti url="" />)

    expect(screen.getByText('Belum ada berkas')).toBeInTheDocument()
  })
})
