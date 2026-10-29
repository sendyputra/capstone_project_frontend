import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { keUnit } from '@/api/adapters/units'
import { units } from '@/api/mocks/data/units'
import { UnitCard } from '@/features/units/components/unit-card'
import { renderWithProviders } from '@/test/render'

/* Unit tanpa foto (image '') muncul di katalog, tabel pemilik, dan detail unit;
   satu komponen GambarUnit melayani ketiganya. */
describe('UnitCard', () => {
  it('unit tanpa foto menampilkan placeholder, bukan gambar putus', () => {
    const unit = keUnit({ ...units[0] })
    renderWithProviders(
      <MemoryRouter>
        <UnitCard unit={{ ...unit, image: '' }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Belum ada foto')).toBeInTheDocument()
  })
})
