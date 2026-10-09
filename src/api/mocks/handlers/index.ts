import { authHandlers } from '@/api/mocks/handlers/auth'
import { unitHandlers } from '@/api/mocks/handlers/units'

export const handlers = [...authHandlers, ...unitHandlers]
