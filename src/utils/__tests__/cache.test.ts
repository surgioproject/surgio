import sinon from 'sinon'
import test from 'ava'
import MockRedis from 'ioredis-mock'

import * as config from '../../config'
import redis from '../../redis'
import { unifiedCache } from '../cache'

const sandbox = sinon.createSandbox()

test.beforeEach(() => {
  sandbox.restore()
  sandbox.stub(redis, 'getRedis').returns(new MockRedis())
  sandbox.stub(config, 'getConfig').returns({
    cache: {
      type: 'redis',
    },
  } as any)
})

test.after(() => {
  sandbox.restore()
})

test('RedisCache should work', async (t) => {
  await unifiedCache.set('key', 'value')
  t.is(await unifiedCache.get('key'), 'value')
  t.is(await unifiedCache.has('key'), true)

  await unifiedCache.del('key')
  t.is(await unifiedCache.has('key'), false)
})
