import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KpiCard } from '@/ui/kpi-card'

describe('KpiCard', () => {
  it('menampilkan label, nilai, dan ikon', () => {
    render(<KpiCard label="Total Unit" nilai="5 Unit" ikon={<span data-testid="ikon" />} />)
    expect(screen.getByText('Total Unit')).toBeInTheDocument()
    expect(screen.getByText('5 Unit')).toBeInTheDocument()
    expect(screen.getByTestId('ikon')).toBeInTheDocument()
  })
})
