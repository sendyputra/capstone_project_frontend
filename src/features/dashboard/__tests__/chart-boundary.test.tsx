import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChartBoundary } from '@/ui/chart-boundary'

function Meledak(): never {
  throw new Error('chunk gagal')
}

describe('ChartBoundary', () => {
  it('menampilkan pesan singkat saat grafik gagal dimuat, bukan meruntuhkan halaman', () => {
    const diam = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <div>
        <p>Panel lain tetap ada</p>
        <ChartBoundary>
          <Meledak />
        </ChartBoundary>
      </div>,
    )

    expect(screen.getByText('Grafik tidak dapat dimuat.')).toBeInTheDocument()
    expect(screen.getByText('Panel lain tetap ada')).toBeInTheDocument()
    diam.mockRestore()
  })
})
