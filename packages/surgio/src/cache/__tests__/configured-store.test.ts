import { afterEach, expect, test, vi } from 'vitest'

import { getConfig } from '../../config.js'
import { createConfiguredStore } from '../configured-store.js'
import { FilesystemKvStore } from '../stores/filesystem.js'
import { RedisKvStore } from '../stores/redis.js'
import { UpstashKvStore } from '../stores/upstash.js'

vi.mock('../../config.js', () => ({
  getConfig: vi.fn(),
}))

const mockedGetConfig = vi.mocked(getConfig)

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

test.each([undefined, 'default', 'filesystem'] as const)(
  'creates the filesystem store for %s configuration',
  (type) => {
    mockedGetConfig.mockReturnValue({
      cache: type === undefined ? undefined : { type },
    } as never)

    const prepared = createConfiguredStore()

    expect(prepared.type).toBe('filesystem')
    expect(prepared.store).toBeInstanceOf(FilesystemKvStore)
  },
)

test('uses official Upstash environment variables as credential fallbacks', () => {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io')
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token')
  mockedGetConfig.mockReturnValue({ cache: { type: 'upstash' } } as never)

  const prepared = createConfiguredStore()

  expect(prepared.type).toBe('upstash')
  expect(prepared.store).toBeInstanceOf(UpstashKvStore)
})

test('reports missing Upstash credentials before the first request', () => {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
  mockedGetConfig.mockReturnValue({ cache: { type: 'upstash' } } as never)

  expect(() => createConfiguredStore()).toThrow(
    'Upstash cache requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN',
  )
})

test.each([
  ['configuration', 'redis://config:6379', ''],
  ['REDIS_URL', undefined, 'redis://env:6379'],
])('creates the Redis store from %s', (_source, redisUrl, envUrl) => {
  vi.stubEnv('REDIS_URL', envUrl)
  mockedGetConfig.mockReturnValue({
    cache: { type: 'redis', redisUrl },
  } as never)

  const prepared = createConfiguredStore()

  expect(prepared.type).toBe('redis')
  expect(prepared.store).toBeInstanceOf(RedisKvStore)
})

test('reports a missing Redis URL before the first request', () => {
  vi.stubEnv('REDIS_URL', '')
  mockedGetConfig.mockReturnValue({ cache: { type: 'redis' } } as never)

  expect(() => createConfiguredStore()).toThrow(
    'Redis cache requires cache.redisUrl or REDIS_URL',
  )
})
