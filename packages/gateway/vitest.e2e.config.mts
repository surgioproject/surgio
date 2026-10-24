import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    include: ['__tests__/e2e/**/*.e2e-spec.ts'],
    setupFiles: ['./__tests__/setup-e2e-tests.ts'],
    testTimeout: 60_000,
  },
})
