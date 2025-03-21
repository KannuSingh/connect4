// Setup mock fetch
import { beforeEach, vi } from 'vitest'

// Mock fetch globally
vi.stubGlobal('fetch', vi.fn())

// Reset mocks between tests
beforeEach(() => {
  vi.resetAllMocks()
}) 