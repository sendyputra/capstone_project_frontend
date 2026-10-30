import { Component, type ReactNode } from 'react'

/* Grafik dimuat sebagai chunk terpisah. Bila unduhannya gagal — tab lama yang
   masih menunjuk nama berkas versi sebelumnya, misalnya setelah deploy — react
   `lazy` melempar, dan tanpa batas lokal seluruh dashboard ikut jatuh ke layar
   galat rute. Panel lain harus tetap terbaca. */
export class ChartBoundary extends Component<{ children: ReactNode }, { gagal: boolean }> {
  state = { gagal: false }

  static getDerivedStateFromError() {
    return { gagal: true }
  }

  render() {
    if (this.state.gagal) return <p className="text-micro text-brand-text-muted">Grafik tidak dapat dimuat.</p>
    return this.props.children
  }
}
