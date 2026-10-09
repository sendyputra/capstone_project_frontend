import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PreviewBar } from '@/features/preview/components/preview-bar'
import { readSession } from '@/features/auth/session'
import { ToastProvider } from '@/ui/toast'

function renderBar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <PreviewBar />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('PreviewBar', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    localStorage.clear()
  })

  it('tidak muncul di luar mode mock', () => {
    renderBar()
    expect(screen.queryByLabelText('Pratinjau peran')).not.toBeInTheDocument()
  })

  it('masuk sebagai akun contoh peran itu lalu menuju rutenya', async () => {
    vi.stubEnv('VITE_API_MOCK', 'on')
    renderBar()

    await userEvent.click(await screen.findByRole('button', { name: 'Pemilik' }))
    await waitFor(() => expect(readSession()?.user.role).toBe('pemilik'))
    expect(readSession()?.user.email).toBe('wahyu@umkm.id')
  })
})
