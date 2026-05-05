import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    pool: 'forks',
    singleFork: true,
    setupFiles: ['./src/tests/setup.ts'],
  },
})
