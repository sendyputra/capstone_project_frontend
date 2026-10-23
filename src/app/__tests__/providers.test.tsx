import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Providers } from '@/app/providers'

describe('Providers', () => {
  it('langsung menampilkan isi aplikasi tanpa menunggu mock', () => {
    render(
      <Providers>
        <p>Isi aplikasi</p>
      </Providers>,
    )

    expect(screen.getByText('Isi aplikasi')).toBeInTheDocument()
  })
})
