import { afterAll, beforeAll, expect, test } from 'vitest'

import redis from '../../redis.js'
import { createTmpFactory } from '../tmp-helper.js'

class MockRedis {
  readonly #values = new Map<string, string>()

  async get(key: string): Promise<string | null> {
    return this.#values.get(key) ?? null
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.#values.set(key, value)
    return 'OK'
  }

  async quit(): Promise<'OK'> {
    return 'OK'
  }
}

beforeAll(() => {
  redis.createRedis('', MockRedis)
})

afterAll(async () => {
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
