import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import type { KvStore } from '../../src/cache/types.js'

interface KvStoreContractContext {
  primary: KvStore
  isolated: KvStore
  cleanup?: () => Promise<void>
}

export const testKvStoreContract = (
  name: string,
  createContext: () => KvStoreContractContext | Promise<KvStoreContractContext>,
): void => {
  describe(`${name} store contract`, () => {
    let context: KvStoreContractContext

    beforeEach(async () => {
      context = await createContext()
    })

    afterEach(async () => {
      await Promise.all([context.primary.close(), context.isolated.close()])
      await context.cleanup?.()
    })

    test('supports overwrite, delete, prefix listing, and namespace isolation', async () => {
      await context.primary.put('alpha', 'before')
      await context.primary.put('alpha', 'after')
      await context.primary.put('beta', 'second')
      await context.isolated.put('alpha', 'isolated')

      expect(await context.primary.get('alpha')).toBe('after')
      expect(await context.isolated.get('alpha')).toBe('isolated')

      const keys: string[] = []
      for await (const key of context.primary.list('a')) keys.push(key)
      expect(keys).toEqual(['alpha'])

      await context.primary.delete('alpha')
      expect(await context.primary.get('alpha')).toBeUndefined()
      expect(await context.isolated.get('alpha')).toBe('isolated')
    })
  })
}
