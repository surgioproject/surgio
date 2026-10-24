import os from 'node:os'
import path from 'node:path'
import './stub-axios.js'
import fs from 'fs-extra'
import { afterAll, beforeAll } from 'vitest'

process.env.NODE_ENV = 'development'

const testCacheDirectory = path.join(
  os.tmpdir(),
  'surgio-vitest-cache',
  `${process.pid}-${process.env.VITEST_POOL_ID ?? '0'}-${
    process.env.VITEST_WORKER_ID ?? '0'
  }`,
)
fs.removeSync(testCacheDirectory)
process.env.SURGIO_CACHE_DIRECTORY = testCacheDirectory

beforeAll(async () => {
  await import('../../src/provider/node-runtime.js')
})

afterAll(async () => {
  await fs.remove(testCacheDirectory)
})

const globalWithOclif = globalThis as typeof globalThis & {
  oclif?: { columns?: number }
}

globalWithOclif.oclif ??= {}
globalWithOclif.oclif.columns = 80
