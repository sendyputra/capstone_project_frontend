import { authHandlers } from '@/api/mocks/handlers/auth'
import { blockHandlers } from '@/api/mocks/handlers/blocks'
import { contractHandlers } from '@/api/mocks/handlers/contracts'
import { paymentHandlers } from '@/api/mocks/handlers/payments'
import { unitHandlers } from '@/api/mocks/handlers/units'

export const handlers = [...authHandlers, ...unitHandlers, ...blockHandlers, ...contractHandlers, ...paymentHandlers]
