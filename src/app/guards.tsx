import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Role } from '@/api/types'
import { useSession } from '@/features/auth/api'

export function RequireSession({ children }: { children: ReactNode }) {
  const { session, isLoading } = useSession()
  if (isLoading) return <p className="p-8 text-body text-brand-text-muted">Memeriksa sesi…</p>
  if (!session) return <Navigate to="/masuk" replace />
  return <>{children}</>
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session, isLoading } = useSession()
  if (isLoading) return <p className="p-8 text-body text-brand-text-muted">Memeriksa sesi…</p>
  if (!session) return <Navigate to="/masuk" replace />
  if (session.user.role !== role) return <Navigate to="/403" replace />
  return <>{children}</>
}
