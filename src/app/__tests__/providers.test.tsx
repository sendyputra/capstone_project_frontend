import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Providers } from '@/app/providers'

vi.mock('@/api/mocks/browser', () => ({ worker: { start: vi.fn().mockResolvedValue(undefined) } }))

describe('Providers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('menahan aplikasi sampai worker mock siap', async () => {
    vi.stubEnv('VITE_API_MOCK', 'on')
    render(
      <Providers>
        <p>Isi aplikasi</p>
      </Providers>,
    )

    expect(screen.getByText('Menyiapkan data contoh…')).toBeInTheDocument()
    expect(screen.queryByText('Isi aplikasi')).not.toBeInTheDocument()
    expect(await screen.findByText('Isi aplikasi')).toBeInTheDocument()
  })

  it('langsung menampilkan aplikasi saat mode mock mati', () => {
    vi.stubEnv('VITE_API_MOCK', 'off')
    render(
      <Providers>
        <p>Isi aplikasi</p>
      </Providers>,
    )

    expect(screen.getByText('Isi aplikasi')).toBeInTheDocument()
    expect(screen.queryByText('Menyiapkan data contoh…')).not.toBeInTheDocument()
  })
})
