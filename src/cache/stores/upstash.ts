import {
  createPhysicalKey,
  createPhysicalPrefix,
  DEFAULT_CACHE_NAMESPACE,
  removePhysicalPrefix,
} from './utils.js'

import type { KvStore, KvStorePutOptions } from '../types.js'

export interface UpstashRedisClient {
  get(key: string): Promise<unknown>
  set(key: string, value: string, options?: { pxat?: number }): Promise<unknown>
  del(...keys: string[]): Promise<unknown>
  scan(
    cursor: number,
    options: { match: string; count: number },
  ): Promise<[number | string, string[]]>
}

export type UpstashRedisClientFactory = (
  url: string,
  token: string,
) => UpstashRedisClient | Promise<UpstashRedisClient>

const createUpstashRedisClient: UpstashRedisClientFactory = async (
  url,
  token,
) => {
  const { Redis } = await import('@upstash/redis')

  return new Redis({ url, token, automaticDeserialization: false })
}

export interface UpstashStoreOptions {
  namespace?: string
  client?: UpstashRedisClient
  createClient?: UpstashRedisClientFactory
}

export class UpstashKvStore implements KvStore {
  readonly #namespace: string
  readonly #url: string
  readonly #token: string
  readonly #createClient: UpstashRedisClientFactory
  #client: UpstashRedisClient | undefined
  #clientPromise: Promise<UpstashRedisClient> | undefined

  constructor(url: string, token: string, options: UpstashStoreOptions = {}) {
    this.#namespace = options.namespace ?? DEFAULT_CACHE_NAMESPACE
    this.#url = url
    this.#token = token
    this.#client = options.client
    this.#createClient = options.createClient ?? createUpstashRedisClient
  }

  async get(key: string): Promise<string | undefined> {
    const client = await this.#getClient()
    const value = await client.get(this.#physicalKey(key))
    return typeof value === 'string' ? value : undefined
  }

  async put(
    key: string,
    value: string,
    options?: KvStorePutOptions,
  ): Promise<void> {
    const client = await this.#getClient()
    await client.set(
      this.#physicalKey(key),
      value,
      options?.expiresAt === undefined
        ? undefined
        : { pxat: options.expiresAt },
    )
  }

  async delete(key: string): Promise<void> {
    const client = await this.#getClient()
    await client.del(this.#physicalKey(key))
  }

  async *list(prefix = ''): AsyncIterable<string> {
    const client = await this.#getClient()
    const physicalPrefix = createPhysicalPrefix(this.#namespace, prefix)
    let cursor: number | string = 0

    do {
      const result = await client.scan(Number(cursor), {
        match: `${physicalPrefix}*`,
        count: 1000,
      })
      cursor = result[0]

      for (const key of result[1]) {
        yield removePhysicalPrefix(this.#namespace, key)
      }
    } while (String(cursor) !== '0')
  }

  async close(): Promise<void> {}

  #physicalKey(key: string): string {
    return createPhysicalKey(this.#namespace, key)
  }

  async #getClient(): Promise<UpstashRedisClient> {
    if (this.#client) {
      return this.#client
    }

    this.#clientPromise ??= Promise.resolve(
      this.#createClient(this.#url, this.#token),
    ).then((client) => {
      this.#client = client
      return client
    })
    return this.#clientPromise
  }
}

export const createUpstashStore = (
  url: string,
  token: string,
  options?: UpstashStoreOptions,
): KvStore => new UpstashKvStore(url, token, options)
