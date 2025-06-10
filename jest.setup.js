import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.GEMINI_API_KEY = 'test-gemini-key'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.CLERK_SECRET_KEY = 'test-clerk-secret'
process.env.CLERK_PUBLISHABLE_KEY = 'test-clerk-public'

// Mock fetch globally
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('validateDOMNesting'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})