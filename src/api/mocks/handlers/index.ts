import { authHandlers } from '@/api/mocks/handlers/auth'
import { bookingHandlers } from '@/api/mocks/handlers/bookings'
import { contractHandlers } from '@/api/mocks/handlers/contracts'
import { paymentHandlers } from '@/api/mocks/handlers/payments'
import { unitHandlers } from '@/api/mocks/handlers/units'
import { userHandlers } from '@/api/mocks/handlers/users'

export const handlers = [
  ...authHandlers,
  ...unitHandlers,
  ...bookingHandlers,
  ...contractHandlers,
  ...paymentHandlers,
  ...userHandlers,
]
