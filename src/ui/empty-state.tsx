import type { ReactNode } from 'react'

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-brand-border-strong bg-brand-surface p-8 text-center">
      <h3 className="text-heading-s font-bold text-brand-text">{title}</h3>
      <p className="mx-auto mt-1 max-w-prose text-body text-brand-text-muted">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
