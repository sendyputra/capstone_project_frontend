import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast } from '@/ui/toast'

function Pemuncul() {
  const { tampilkan } = useToast()
  return <button onClick={() => tampilkan('Unit baru tersimpan.', 'success')}>Munculkan</button>
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('menolak dipakai di luar penyedianya', () => {
    expect(() => renderHook(() => useToast())).toThrow('useToast dipakai di luar ToastProvider')
  })

  it('menampilkan pesan aksi di wadah status', async () => {
    render(
      <ToastProvider>
        <Pemuncul />
      </ToastProvider>,
    )
    await act(async () => {
      screen.getByRole('button', { name: 'Munculkan' }).click()
    })
    expect(screen.getByRole('status')).toHaveTextContent('Unit baru tersimpan.')
  })

  it('menyingkirkan pesan setelah 4500 ms', async () => {
    render(
      <ToastProvider>
        <Pemuncul />
      </ToastProvider>,
    )
    await act(async () => {
      screen.getByRole('button', { name: 'Munculkan' }).click()
    })
    expect(screen.getByRole('status')).toHaveTextContent('Unit baru tersimpan.')

    await act(async () => {
      vi.advanceTimersByTime(4500)
    })
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
