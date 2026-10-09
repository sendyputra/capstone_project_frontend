import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const KUNCI = 'nb.theme'

function bacaAwal(): Theme {
  const tersimpan = localStorage.getItem(KUNCI)
  return tersimpan === 'dark' ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(bacaAwal)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(KUNCI, theme)
  }, [theme])

  const toggle = useCallback(() => setTheme((lama) => (lama === 'dark' ? 'light' : 'dark')), [])
  return { theme, toggle }
}
