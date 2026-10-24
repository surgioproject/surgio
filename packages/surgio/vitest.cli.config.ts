import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    disableConsoleIntercept: true,
    environment: 'node',
    include: ['test/**/*.cli-test.ts'],
    setupFiles: ['./test/helpers/setup.ts'],
    testTimeout: 60_000,
  },
})
