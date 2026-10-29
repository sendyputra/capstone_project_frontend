import { cleanup, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusChip } from '@/ui/status-chip'

describe('StatusChip', () => {
  it('memberi warna sesuai makna status, bukan satu warna untuk semua', () => {
    render(
      <div>
        <StatusChip nilai="Tersedia" />
        <StatusChip nilai="Ditolak" />
        <StatusChip nilai="Belum Bayar" />
        <StatusChip nilai="Aktif" />
      </div>,
    )
    expect(screen.getByText('Tersedia')).toHaveClass('bg-brand-success-soft')
    expect(screen.getByText('Ditolak')).toHaveClass('bg-brand-danger-soft')
    expect(screen.getByText('Belum Bayar')).toHaveClass('bg-brand-warning-soft')
    expect(screen.getByText('Aktif')).toHaveClass('bg-brand-success-soft')
  })

  it('memakai warna netral untuk status yang tidak dikenal', () => {
    render(<StatusChip nilai="Entah" />)
    expect(screen.getByText('Entah')).toHaveClass('bg-brand-surface-sunken')
  })

  it('memberi nada untuk Perawatan dan Menunggu', () => {
    render(<StatusChip nilai="Perawatan" />)
    expect(screen.getByText('Perawatan')).toHaveClass('bg-brand-warning-soft')
    cleanup()
    render(<StatusChip nilai="Menunggu" />)
    expect(screen.getByText('Menunggu')).toHaveClass('bg-brand-warning-soft')
  })

  it('tidak pecah untuk status tak dikenal', () => {
    render(<StatusChip nilai="entah" />)
    expect(screen.getByText('entah')).toBeInTheDocument()
  })

  /* Unit terisi adalah keadaan normal, bukan galat; nada bahaya hanya untuk
     penolakan dan pembatalan. */
  it('memberi nada informasi, bukan bahaya, untuk Terisi', () => {
    render(<StatusChip nilai="Terisi" />)
    expect(screen.getByText('Terisi')).toHaveClass('bg-brand-accent-track')
  })
})
