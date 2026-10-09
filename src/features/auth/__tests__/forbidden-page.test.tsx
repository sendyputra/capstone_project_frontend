import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { ForbiddenPage } from '@/app/pages/forbidden-page'
import { renderWithProviders } from '@/test/render'

describe('ForbiddenPage', () => {
  it('menjelaskan peran yang tidak cocok dan menyediakan jalan kembali', () => {
    renderWithProviders(
      <MemoryRouter>
        <ForbiddenPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Halaman ini bukan untuk peran Anda')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kembali ke beranda' })).toHaveAttribute('href', '/')
  })
})
