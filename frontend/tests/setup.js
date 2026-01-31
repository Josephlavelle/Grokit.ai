import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { server } from './mocks/server'

// Start MSW server before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Close server after all tests
afterAll(() => server.close())
