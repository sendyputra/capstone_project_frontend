import { setupWorker } from 'msw/browser'
import { handlers } from '@/api/mocks/handlers'

export const worker = setupWorker(...handlers)
