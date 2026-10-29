import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { KalenderKetersediaan } from '@/features/units/components/kalender-ketersediaan'
import { tanggalHariIni } from '@/lib/tanggal'

const bulanIni = tanggalHariIni().slice(0, 7)

function geserBulan(bulan: string, langkah: number): string {
  const [tahun, nomor] = bulan.split('-').map(Number)
  const total = tahun * 12 + (nomor - 1) + langkah
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

describe('KalenderKetersediaan', () => {
  it('menampilkan tanggal ISO pada bulan berjalan', () => {
    render(<KalenderKetersediaan tanggalTerisi={[`${bulanIni}-05`]} />)

    expect(screen.getByTestId(`tanggal-${bulanIni}-05`)).toHaveClass('bg-brand-danger-soft')
    expect(screen.getByTestId(`tanggal-${tanggalHariIni()}`)).toBeInTheDocument()
  })

  it('berpindah ke bulan berikutnya', async () => {
    render(<KalenderKetersediaan tanggalTerisi={[]} />)

    await userEvent.click(screen.getByRole('button', { name: 'Bulan berikutnya' }))

    expect(screen.getByTestId(`tanggal-${geserBulan(bulanIni, 1)}-01`)).toBeInTheDocument()
  })

  it('membedakan tanggal diblokir', () => {
    render(<KalenderKetersediaan tanggalTerisi={[]} tanggalDiblokir={[`${bulanIni}-10`]} />)

    expect(screen.getByTestId(`tanggal-${bulanIni}-10`)).toHaveClass('bg-brand-warning-soft')
    expect(screen.getByText('Diblokir')).toBeInTheDocument()
  })

  it('legenda menyebut tiga keadaan', () => {
    render(<KalenderKetersediaan tanggalTerisi={[]} />)

    expect(screen.getByText('Tersedia')).toBeInTheDocument()
    expect(screen.getByText('Terisi / Booked')).toBeInTheDocument()
    expect(screen.getByText('Diblokir')).toBeInTheDocument()
  })
})
