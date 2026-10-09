import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ConfirmProvider, useKonfirmasi } from '@/ui/confirm-dialog'

function Pemakai({ onHasil }: { onHasil: (nilai: boolean) => void }) {
  const konfirmasi = useKonfirmasi()
  return (
    <button
      onClick={async () =>
        onHasil(await konfirmasi({ judul: 'Hapus unit ini?', pesan: 'Unit yang dihapus tidak dapat dikembalikan.', labelKonfirmasi: 'Hapus unit' }))
      }
    >
      Picu
    </button>
  )
}

describe('ConfirmProvider', () => {
  it('menolak dipakai di luar penyedianya', () => {
    expect(() => render(<Pemakai onHasil={() => undefined} />)).toThrow('useKonfirmasi dipakai di luar ConfirmProvider')
  })

  it('mengembalikan true saat disetujui', async () => {
    const hasil: boolean[] = []
    render(
      <ConfirmProvider>
        <Pemakai onHasil={(nilai) => hasil.push(nilai)} />
      </ConfirmProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Picu' }))
    expect(await screen.findByText('Hapus unit ini?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Hapus unit' }))
    await waitFor(() => expect(hasil).toEqual([true]))
  })

  it('mengembalikan false saat dibatalkan', async () => {
    const hasil: boolean[] = []
    render(
      <ConfirmProvider>
        <Pemakai onHasil={(nilai) => hasil.push(nilai)} />
      </ConfirmProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Picu' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Batal' }))
    await waitFor(() => expect(hasil).toEqual([false]))
  })
})
