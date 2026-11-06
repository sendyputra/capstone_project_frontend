import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TabelSaring } from '@/ui/tabel-saring'

type Baris = { id: number; nama: string; kota: string; status: string }

const baris: Baris[] = [
  { id: 1, nama: 'Kos Kamar 01', kota: 'Bandung', status: 'Tersedia' },
  { id: 2, nama: 'Kontrakan Asri', kota: 'Cimahi', status: 'Terisi' },
]

function renderTabel() {
  render(
    <TabelSaring
      kolom={['Nama', 'Kota', 'Status']}
      baris={baris}
      saringan={[
        { nilai: (b) => b.nama },
        { nilai: (b) => b.kota },
        { jenis: 'pilihan', nilai: (b) => b.status, pilihan: ['Tersedia', 'Terisi'] },
      ]}
    >
      {(tampil) =>
        tampil.map((b) => (
          <tr key={b.id}>
            <td>{b.nama}</td>
            <td>{b.kota}</td>
            <td>{b.status}</td>
          </tr>
        ))
      }
    </TabelSaring>,
  )
}

describe('TabelSaring', () => {
  it('menampilkan semua baris sebelum disaring', () => {
    renderTabel()

    expect(screen.getByText('Kos Kamar 01')).toBeInTheDocument()
    expect(screen.getByText('Kontrakan Asri')).toBeInTheDocument()
  })

  it('memberi satu saringan untuk tiap kolom yang punya saringan', () => {
    renderTabel()

    expect(screen.getByLabelText('Saring Nama')).toBeInTheDocument()
    expect(screen.getByLabelText('Saring Kota')).toBeInTheDocument()
    expect(screen.getByLabelText('Saring Status')).toBeInTheDocument()
  })

  it('menyaring lewat kolom nama, tanpa peduli besar huruf', async () => {
    renderTabel()

    await userEvent.type(screen.getByLabelText('Saring Nama'), 'asri')

    expect(screen.getByText('Kontrakan Asri')).toBeInTheDocument()
    expect(screen.queryByText('Kos Kamar 01')).not.toBeInTheDocument()
  })

  it('menyaring lewat kolom lain secara terpisah', async () => {
    renderTabel()

    await userEvent.type(screen.getByLabelText('Saring Kota'), 'cimahi')

    expect(screen.getByText('Kontrakan Asri')).toBeInTheDocument()
    expect(screen.queryByText('Kos Kamar 01')).not.toBeInTheDocument()
  })

  it('menyaring kolom status lewat pilihan', async () => {
    renderTabel()

    await userEvent.selectOptions(screen.getByLabelText('Saring Status'), 'Tersedia')

    expect(screen.getByText('Kos Kamar 01')).toBeInTheDocument()
    expect(screen.queryByText('Kontrakan Asri')).not.toBeInTheDocument()
  })

  it('menggabungkan saringan antar kolom', async () => {
    renderTabel()

    await userEvent.type(screen.getByLabelText('Saring Kota'), 'bandung')
    await userEvent.selectOptions(screen.getByLabelText('Saring Status'), 'Terisi')

    expect(screen.getByText('Tidak ada baris yang cocok.')).toBeInTheDocument()
  })

  it('memberi tahu saat saringan tidak menyisakan baris', async () => {
    renderTabel()

    await userEvent.type(screen.getByLabelText('Saring Nama'), 'tidak-ada')

    expect(screen.getByText('Tidak ada baris yang cocok.')).toBeInTheDocument()
    /* Kepala dan saringan tetap ada supaya isian yang salah bisa dihapus. */
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByLabelText('Saring Nama')).toBeInTheDocument()
  })

  it('memakai pesan kosong khusus bila diminta', () => {
    render(
      <TabelSaring kolom={['Nama']} baris={[]} saringan={[{ nilai: (b: Baris) => b.nama }]} kosong="Belum ada data.">
        {() => null}
      </TabelSaring>,
    )

    expect(screen.getByText('Belum ada data.')).toBeInTheDocument()
  })
})
