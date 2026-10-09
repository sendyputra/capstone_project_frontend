import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faCircleExclamation, faCircleInfo, faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type JenisToast = 'success' | 'danger' | 'warning' | 'info'
type Toast = { id: number; pesan: string; jenis: JenisToast }

const ToastContext = createContext<{ tampilkan: (pesan: string, jenis?: JenisToast) => void } | null>(null)

/* Tepi, ikon, dan warna per tone — empat tone seperti purwarupa. */
const gaya: Record<JenisToast, { tepi: string; ikon: typeof faCircleInfo; warna: string }> = {
  success: { tepi: 'border-l-brand-success', ikon: faCircleCheck, warna: 'text-brand-success' },
  danger: { tepi: 'border-l-brand-danger', ikon: faCircleExclamation, warna: 'text-brand-danger' },
  warning: { tepi: 'border-l-brand-warning', ikon: faTriangleExclamation, warna: 'text-brand-warning' },
  info: { tepi: 'border-l-brand-accent', ikon: faCircleInfo, warna: 'text-brand-accent' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [daftar, setDaftar] = useState<Toast[]>([])

  const tampilkan = useCallback((pesan: string, jenis: JenisToast = 'info') => {
    const id = Date.now() + Math.random()
    setDaftar((lama) => [...lama, { id, pesan, jenis }])
    setTimeout(() => setDaftar((lama) => lama.filter((toast) => toast.id !== id)), 4500)
  }, [])

  const tutup = useCallback((id: number) => setDaftar((lama) => lama.filter((toast) => toast.id !== id)), [])

  const nilai = useMemo(() => ({ tampilkan }), [tampilkan])

  return (
    <ToastContext.Provider value={nilai}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 top-4 z-[var(--z-toast)] flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {daftar.map((toast) => (
          <div key={toast.id} className={`pointer-events-auto flex items-start gap-3 rounded-lg border border-brand-border border-l-4 bg-brand-surface p-4 shadow-lg ${gaya[toast.jenis].tepi}`}>
            <FontAwesomeIcon icon={gaya[toast.jenis].ikon} aria-hidden className={`mt-0.5 shrink-0 ${gaya[toast.jenis].warna}`} />
            <p className="min-w-0 flex-1 text-ui font-medium text-brand-text">{toast.pesan}</p>
            <button type="button" onClick={() => tutup(toast.id)} aria-label="Tutup notifikasi" className="shrink-0 text-brand-text-subtle">
              <FontAwesomeIcon icon={faXmark} aria-hidden />
            </button>
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
