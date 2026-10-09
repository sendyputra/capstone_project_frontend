import { Button } from '@/ui/button'

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-brand-danger-border bg-brand-danger-soft p-6">
      <p className="text-body text-brand-danger-soft-fg">{message}</p>
      {onRetry && (
        <Button variant="destructive" className="mt-3" onClick={onRetry}>
          Coba Lagi
        </Button>
      )}
    </div>
  )
}
