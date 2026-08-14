import { beforeEach, expect, test, vi } from 'vitest'
import MockRedis from 'ioredis-mock'

import * as config from '../../config'
import redis from '../../redis'
import { unifiedCache } from '../cache'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(redis, 'getRedis').mockReturnValue(new MockRedis())
  vi.spyOn(config, 'getConfig').mockReturnValue({
    cache: {
      type: 'redis',
    },
  } as any)
})

test('RedisCache should work', async () => {
  await unifiedCache.set('key', 'value')
  expect(await unifiedCache.get('key')).toBe('value')
  expect(await unifiedCache.has('key')).toBe(true)

  await unifiedCache.del('key')
  expect(await unifiedCache.has('key')).toBe(false)
})
