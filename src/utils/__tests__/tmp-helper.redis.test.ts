import { afterAll, beforeAll, expect, test } from 'vitest'
import sinon from 'sinon'
import MockRedis from 'ioredis-mock'

import redis from '../../redis'
import { createTmpFactory } from '../tmp-helper'

const sandbox = sinon.createSandbox()

beforeAll(() => {
  redis.createRedis('', MockRedis)
})

afterAll(async () => {
  sandbox.restore()
  await redis.destroyRedis()
})

test('should work', async () => {
  const factory = createTmpFactory('tmp-helper-test', 'redis')

  const tmp = factory('tmp1.txt')

  expect(await tmp.getContent()).toBe(void 0)
  await tmp.setContent('123456abcdef')
  expect(await tmp.getContent()).toBe('123456abcdef')
  expect(await tmp.getContent()).toBe('123456abcdef')
})
