import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./__tests__/setup-tests.ts'],
    testTimeout: 30_000,
    coverage: {
      provider: 'istanbul',
      reporter: ['html', 'text-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,js}'],
      exclude: ['src/**/*.spec.ts'],
    },
  },
})
