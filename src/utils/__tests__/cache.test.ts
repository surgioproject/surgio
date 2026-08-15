import { beforeEach, expect, test, vi } from 'vitest'

vi.mock('@keyv/redis', async () => {
  const { Keyv } = await vi.importActual<typeof import('keyv')>('keyv')
  return { createKeyv: vi.fn(() => new Keyv()) }
})

import * as config from '../../config'
import { UnifiedCache, unifiedCache } from '../cache'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(config, 'getConfig').mockReturnValue({
    cache: {
      type: 'redis',
      redisUrl: 'redis://localhost:6379',
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

test('bulk cache operations should work', async () => {
  await unifiedCache.mset([
    ['one', 1],
    ['two', 2],
  ])

  expect(await unifiedCache.mget<number>('one', 'two')).toEqual([1, 2])
  expect((await unifiedCache.keys()).sort()).toEqual(['one', 'two'])

  await unifiedCache.mdel('one', 'two')
  expect(await unifiedCache.mget('one', 'two')).toEqual([undefined, undefined])
})

test('wrap and reset should work with the default cache', async () => {
  vi.spyOn(config, 'getConfig').mockReturnValue({
    cache: { type: 'default' },
  } as any)
  const cache = new UnifiedCache()

  expect(await cache.wrap('wrapped', () => 'value')).toBe('value')
  expect(await cache.wrap('wrapped', () => 'other')).toBe('value')

  await cache.reset()
  expect(await cache.get('wrapped')).toBeUndefined()
})
