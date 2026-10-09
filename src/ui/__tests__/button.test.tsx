import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '@/ui/button'

describe('Button', () => {
  it('memakai token aksen pada varian utama', () => {
    render(<Button>Simpan</Button>)
    expect(screen.getByRole('button', { name: 'Simpan' })).toHaveClass('bg-primary')
  })

  it('memakai permukaan bahaya pada varian merusak', () => {
    render(<Button variant="destructive">Hapus</Button>)
    expect(screen.getByRole('button', { name: 'Hapus' })).toHaveClass('bg-destructive')
  })
})
