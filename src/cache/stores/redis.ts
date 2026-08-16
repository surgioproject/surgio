import {
  createPhysicalKey,
  createPhysicalPrefix,
  DEFAULT_CACHE_NAMESPACE,
  removePhysicalPrefix,
} from './utils.js'

import type { Redis as RedisClient } from 'ioredis'
import type { KvStore, KvStorePutOptions } from '../types.js'

export type RedisClientFactory = (
  redisUrl: string,
) => RedisClient | Promise<RedisClient>

const createIoredisClient: RedisClientFactory = async (redisUrl) => {
  const { Redis } = await import('ioredis')

  return new Redis(redisUrl, {
    family: 0,
    lazyConnect: true,
  })
}

export interface RedisStoreOptions {
  namespace?: string
  client?: RedisClient
  createClient?: RedisClientFactory
}

export class RedisKvStore implements KvStore {
  readonly #namespace: string
  readonly #redisUrl: string
  readonly #ownsClient: boolean
  readonly #createClient: RedisClientFactory
  #client: RedisClient | undefined
  #clientPromise: Promise<RedisClient> | undefined

  constructor(redisUrl: string, options: RedisStoreOptions = {}) {
    this.#namespace = options.namespace ?? DEFAULT_CACHE_NAMESPACE
    this.#redisUrl = redisUrl
    this.#client = options.client
    this.#ownsClient = !options.client
    this.#createClient = options.createClient ?? createIoredisClient
  }

  async get(key: string): Promise<string | undefined> {
    const client = await this.#getClient()
    return (await client.get(this.#physicalKey(key))) ?? undefined
  }

  async put(
    key: string,
    value: string,
    options?: KvStorePutOptions,
  ): Promise<void> {
    const physicalKey = this.#physicalKey(key)
    const client = await this.#getClient()
    if (options?.expiresAt === undefined) {
      await client.set(physicalKey, value)
    } else {
      await client.set(physicalKey, value, 'PXAT', options.expiresAt)
    }
  }

  async delete(key: string): Promise<void> {
    const client = await this.#getClient()
    await client.del(this.#physicalKey(key))
  }

  async *list(prefix = ''): AsyncIterable<string> {
    const client = await this.#getClient()
    const physicalPrefix = createPhysicalPrefix(this.#namespace, prefix)
    let cursor = '0'

    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        'MATCH',
        `${physicalPrefix}*`,
        'COUNT',
        1000,
      )
      cursor = nextCursor

      for (const key of keys) {
        yield removePhysicalPrefix(this.#namespace, key)
      }
    } while (cursor !== '0')
  }

  async close(): Promise<void> {
    if (!this.#ownsClient) {
      return
    }

    const client =
      this.#client ??
      (this.#clientPromise === undefined
        ? undefined
        : await this.#clientPromise)
    if (client) {
      await client.quit()
    }
  }

  #physicalKey(key: string): string {
    return createPhysicalKey(this.#namespace, key)
  }

  async #getClient(): Promise<RedisClient> {
    if (this.#client) {
      return this.#client
    }

    this.#clientPromise ??= Promise.resolve(
      this.#createClient(this.#redisUrl),
    ).then((client) => {
      this.#client = client
      return client
    })
    return this.#clientPromise
  }
}

export const createRedisStore = (
  redisUrl: string,
  options?: RedisStoreOptions,
): KvStore => new RedisKvStore(redisUrl, options)
