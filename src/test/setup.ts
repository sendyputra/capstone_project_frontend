import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '@/api/mocks/server'
import { resetData } from '@/api/mocks/data/reset'
import { resetSimulasi } from '@/api/mocks/handlers/simulasi'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))

afterEach(() => {
  cleanup()
  localStorage.clear()
  server.resetHandlers()
  resetSimulasi()
  resetData()
})

afterAll(() => server.close())
