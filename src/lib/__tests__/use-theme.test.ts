import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTheme } from '@/lib/use-theme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('memasang tema terang secara bawaan', () => {
    renderHook(() => useTheme())
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('mengganti tema dan mengingatnya', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle())
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('nb.theme')).toBe('dark')
  })
})
