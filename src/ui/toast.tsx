import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type JenisToast = 'success' | 'danger' | 'info'
type Toast = { id: number; pesan: string; jenis: JenisToast }

const ToastContext = createContext<{ tampilkan: (pesan: string, jenis?: JenisToast) => void } | null>(null)

const warnaTepi: Record<JenisToast, string> = {
  success: 'border-l-brand-success',
  danger: 'border-l-brand-danger',
  info: 'border-l-brand-accent',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [daftar, setDaftar] = useState<Toast[]>([])

  const tampilkan = useCallback((pesan: string, jenis: JenisToast = 'info') => {
    const id = Date.now() + Math.random()
    setDaftar((lama) => [...lama, { id, pesan, jenis }])
    setTimeout(() => setDaftar((lama) => lama.filter((toast) => toast.id !== id)), 4500)
  }, [])

  const nilai = useMemo(() => ({ tampilkan }), [tampilkan])

  return (
    <ToastContext.Provider value={nilai}>
      {children}
      <div role="status" aria-live="polite" className="fixed right-4 top-4 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {daftar.map((toast) => (
          <div key={toast.id} className={`rounded-lg border border-brand-border border-l-4 bg-brand-surface p-4 shadow-lg ${warnaTepi[toast.jenis]}`}>
            <p className="text-ui font-medium text-brand-text">{toast.pesan}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const nilai = useContext(ToastContext)
  if (!nilai) throw new Error('useToast dipakai di luar ToastProvider')
  return nilai
}
