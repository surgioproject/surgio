import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    exclude: ['test/fixture/worker/**/*.test.ts'],
    setupFiles: ['./test/helpers/setup.ts'],
    testTimeout: 30_000,
    coverage: {
      provider: 'istanbul',
      reporter: ['html', 'text-summary', 'lcov'],
    },
  },
})
