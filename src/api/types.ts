export type Role = 'penyewa' | 'pemilik' | 'admin'

export type User = { id: number; name: string; email: string; role: Role }

export type UnitStatus = 'Tersedia' | 'Terisi'

export type Unit = {
  id: number
  owner_id: number
  name: string
  address: string
  price: number
  status: UnitStatus
}

export type ApiErrorKind = 'unauthorized' | 'validation' | 'not_found' | 'conflict' | 'server' | 'network'

export class ApiError extends Error {
  kind: ApiErrorKind
  status: number
  fields?: Record<string, string>

  constructor(kind: ApiErrorKind, status: number, message: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.fields = fields
  }
}
