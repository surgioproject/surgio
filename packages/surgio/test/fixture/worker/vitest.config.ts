import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: 'test/fixture/worker/wrangler.jsonc' },
    }),
  ],
  test: {
    include: ['test/fixture/worker/worker.test.ts'],
  },
})
