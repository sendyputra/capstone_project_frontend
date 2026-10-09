import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState } from '@/ui/empty-state'
import { ErrorState } from '@/ui/error-state'
import { renderWithProviders } from '@/test/render'

describe('EmptyState', () => {
  it('menampilkan sebab dan aksi', () => {
    renderWithProviders(<EmptyState title="Belum ada unit" description="Tambahkan unit pertama Anda." action={<button>Tambah Unit Baru</button>} />)
    expect(screen.getByText('Belum ada unit')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tambah Unit Baru' })).toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('menampilkan sebab dan memanggil coba ulang', async () => {
    const ulang = vi.fn()
    renderWithProviders(<ErrorState message="Koneksi terputus." onRetry={ulang} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Koneksi terputus.')
    await userEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    expect(ulang).toHaveBeenCalledOnce()
  })

  it('tidak menampilkan tombol bila tidak ada coba ulang', () => {
    renderWithProviders(<ErrorState message="Unit tidak ditemukan." />)
    expect(screen.queryByRole('button', { name: 'Coba Lagi' })).not.toBeInTheDocument()
  })
})
