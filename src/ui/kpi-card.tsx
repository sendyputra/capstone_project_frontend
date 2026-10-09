import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const toneIkon: Record<string, string> = {
  accent: 'bg-brand-accent-soft text-brand-accent',
  success: 'bg-brand-success-soft text-brand-success',
  danger: 'bg-brand-danger-soft text-brand-danger',
  warning: 'bg-brand-warning-soft text-brand-warning-soft-fg',
}

/* Kartu angka dashboard: label kecil di atas, nilai besar di bawah, ikon di
   sisi kanan — bentuk yang sama dipakai pemilik dan admin. */
export function KpiCard({ label, nilai, ikon, tone = 'accent' }: { label: string; nilai: string; ikon?: ReactNode; tone?: keyof typeof toneIkon }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm">
      <div>
        <p className="text-label font-semibold uppercase tracking-label text-brand-text-muted">{label}</p>
        <p className="mt-1 text-heading-l font-bold text-brand-text">{nilai}</p>
      </div>
      {ikon && <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-xl', toneIkon[tone])}>{ikon}</div>}
    </div>
  )
}
