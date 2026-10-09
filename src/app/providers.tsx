import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { ToastProvider } from '@/ui/toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: (jumlah, galat) => jumlah < 1 && (galat as { kind?: string }).kind === 'network' },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  const [siap, setSiap] = useState(import.meta.env.VITE_API_MOCK !== 'on')

  useEffect(() => {
    if (import.meta.env.VITE_API_MOCK !== 'on') return
    let batal = false
    import('@/api/mocks/browser').then(async ({ worker }) => {
      await worker.start({ onUnhandledFrame: 'bypass' })
      if (!batal) setSiap(true)
    })
    return () => { batal = true }
  }, [])

  if (!siap) return <p className="p-8 text-body text-brand-text-muted">Menyiapkan data contoh…</p>

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  )
}
