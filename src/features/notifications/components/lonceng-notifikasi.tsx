import { Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNotifications, useTandaiNotifikasi, useTandaiSemua } from '@/features/notifications/api'
import { formatTanggal } from '@/lib/format'

/* Lonceng pengingat tagihan: badge jumlah belum dibaca, panel 50 notifikasi
   terbaru, dan penandaan dibaca per baris atau sekaligus. */
export function LoncengNotifikasi() {
  const [buka, setBuka] = useState(false)
  const notifikasi = useNotifications()
  const tandai = useTandaiNotifikasi()
  const tandaiSemua = useTandaiSemua()
  const rows = notifikasi.data?.rows ?? []
  const unread = notifikasi.data?.unread ?? 0

  useEffect(() => {
    if (!buka) return
    function tutupDenganEscape(peristiwa: KeyboardEvent) {
      if (peristiwa.key === 'Escape') setBuka(false)
    }
    document.addEventListener('keydown', tutupDenganEscape)
    return () => document.removeEventListener('keydown', tutupDenganEscape)
  }, [buka])

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifikasi"
        aria-expanded={buka}
        onClick={() => setBuka((nilai) => !nilai)}
        className="relative rounded-lg p-2 text-brand-text-muted hover:bg-brand-surface-sunken hover:text-brand-text"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-brand-danger px-1 text-[10px] font-bold text-brand-danger-fg">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {buka && (
        <div
          role="dialog"
          aria-label="Notifikasi"
          className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-brand-border bg-brand-surface p-3 shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-brand-border pb-2">
            <span className="text-ui font-bold text-brand-text">Notifikasi</span>
            {unread > 0 && (
              <button
                type="button"
                disabled={tandaiSemua.isPending}
                onClick={() => tandaiSemua.mutate()}
                className="text-micro font-semibold text-brand-accent disabled:opacity-60"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 divide-y divide-brand-border overflow-y-auto">
            {rows.length === 0 && <p className="py-4 text-center text-micro text-brand-text-subtle">Belum ada notifikasi.</p>}
            {rows.map((baris) => (
              <button
                key={baris.id}
                type="button"
                disabled={baris.read_at !== null}
                onClick={() => tandai.mutate(baris.id)}
                className={`block w-full py-2 text-left text-ui text-brand-text ${baris.read_at === null ? 'font-semibold' : 'text-brand-text-muted'}`}
              >
                <span className="block">{baris.message}</span>
                <span className="block text-micro font-normal text-brand-text-subtle">{formatTanggal(baris.created_at)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
