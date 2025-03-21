import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    typecheck: {
      tsconfig: './tsconfig.vitest.json',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
}) 