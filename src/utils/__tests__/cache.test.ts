import sinon from 'sinon'
import { afterAll, beforeEach, expect, test, vi } from 'vitest'
import MockRedis from 'ioredis-mock'

import * as config from '../../config'
import redis from '../../redis'
import { unifiedCache } from '../cache'

const sandbox = sinon.createSandbox()

beforeEach(() => {
  sandbox.restore()
  sandbox.stub(redis, 'getRedis').returns(new MockRedis())
  vi.spyOn(config, 'getConfig').mockReturnValue({
    cache: {
      type: 'redis',
    },
  } as any)
})

afterAll(() => {
  sandbox.restore()
})

test('RedisCache should work', async () => {
  await unifiedCache.set('key', 'value')
  expect(await unifiedCache.get('key')).toBe('value')
  expect(await unifiedCache.has('key')).toBe(true)

  await unifiedCache.del('key')
  expect(await unifiedCache.has('key')).toBe(false)
})
