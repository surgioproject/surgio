import os from 'node:os'
import path from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import fs from 'fs-extra'

import { testKvStoreContract } from '../../../test/helpers/kv-store-contract.js'
import { FilesystemKvStore } from '../stores/filesystem.js'
import { TtlCache } from '../ttl-cache.js'

const directories: string[] = []

afterEach(async () => {
  vi.useRealTimers()
  await Promise.all(
    directories.splice(0).map((directory) => fs.remove(directory)),
  )
})

const createDirectory = async (): Promise<string> => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'surgio-cache-test-'),
  )
  directories.push(directory)
  return directory
}

testKvStoreContract('filesystem', async () => {
  const directory = await createDirectory()
  return {
    primary: new FilesystemKvStore({ directory, namespace: 'primary' }),
    isolated: new FilesystemKvStore({ directory, namespace: 'isolated' }),
  }
})

test('persists values across store instances and isolates namespaces', async () => {
  const directory = await createDirectory()
  const first = new TtlCache({
    store: new FilesystemKvStore({ directory, namespace: 'one' }),
  })
  await first.set('../unsafe/key', { value: 1 })

  const reopened = new TtlCache({
    store: new FilesystemKvStore({ directory, namespace: 'one' }),
  })
  const isolated = new TtlCache({
    store: new FilesystemKvStore({ directory, namespace: 'two' }),
  })

  expect(await reopened.get('../unsafe/key')).toEqual({ value: 1 })
  expect(await isolated.get('../unsafe/key')).toBeUndefined()
  expect(await fs.pathExists(path.join(directory, 'unsafe'))).toBe(false)
})

test('atomically overwrites values and resets only its namespace', async () => {
  const directory = await createDirectory()
  const one = new TtlCache({
    store: new FilesystemKvStore({ directory, namespace: 'one' }),
  })
  const two = new TtlCache({
    store: new FilesystemKvStore({ directory, namespace: 'two' }),
  })

  await one.set('key', 'before')
  await one.set('key', 'after')
  await two.set('key', 'isolated')
  await one.reset()

  expect(await one.get('key')).toBeUndefined()
  expect(await two.get('key')).toBe('isolated')
})

test('physically removes expired records while reading and listing', async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  const directory = await createDirectory()
  const store = new FilesystemKvStore({ directory })

  await store.put('expired', 'value', { expiresAt: Date.now() + 1000 })
  vi.advanceTimersByTime(1000)

  expect(await store.get('expired')).toBeUndefined()
  const keys: string[] = []
  for await (const key of store.list()) keys.push(key)
  expect(keys).toEqual([])
})
