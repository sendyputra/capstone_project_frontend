import { useEffect, useState } from 'react'

/* Warna grafik harus datang dari token, bukan nilai tetap: `tokens.css`
   mengganti `--accent`, `--success-solid`, dan seterusnya ketika peran atau
   tema berganti, sedangkan ApexCharts butuh warna yang sudah terselesaikan.
   Karena itu nilainya dibaca dari elemen akar, bukan dari impor CSS. */
export type ChartPalette = {
  accent: string
  success: string
  warning: string
  textMuted: string
  border: string
  surface: string
}

const NAMA: Record<keyof ChartPalette, string> = {
  accent: '--accent',
  success: '--success-solid',
  warning: '--warning-solid',
  textMuted: '--text-muted',
  border: '--border',
  surface: '--surface',
}

function baca(): ChartPalette {
  const gaya = getComputedStyle(document.documentElement)
  const nilai = (kunci: keyof ChartPalette) => gaya.getPropertyValue(NAMA[kunci]).trim()
  return {
    accent: nilai('accent'),
    success: nilai('success'),
    warning: nilai('warning'),
    textMuted: nilai('textMuted'),
    border: nilai('border'),
    surface: nilai('surface'),
  }
}

export function useChartPalette(): ChartPalette {
  const [palet, setPalet] = useState(baca)

  useEffect(() => {
    const amati = new MutationObserver(() => setPalet(baca()))
    amati.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-role'] })
    return () => amati.disconnect()
  }, [])

  return palet
}
