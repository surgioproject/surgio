import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    disableConsoleIntercept: true,
    environment: 'node',
    // @oclif/test locates the CLI by walking up from the pnpm store, which lives at the workspace root.
    env: { OCLIF_TEST_ROOT: import.meta.dirname },
    include: ['test/**/*.cli-test.ts'],
    setupFiles: ['./test/helpers/setup.ts'],
    testTimeout: 60_000,
  },
})
