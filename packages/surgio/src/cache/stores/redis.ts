import {
  createPhysicalKey,
  createPhysicalPrefix,
  DEFAULT_CACHE_NAMESPACE,
  removePhysicalPrefix,
} from './utils.js'

import type { KvStore, KvStorePutOptions } from '../types.js'

export interface RedisClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<unknown>
  set(
    key: string,
    value: string,
    unixTimeMillisecondsToken: 'PXAT',
    unixTimeMilliseconds: number,
  ): Promise<unknown>
  del(...keys: string[]): Promise<unknown>
  scan(
    cursor: string,
    patternToken: 'MATCH',
    pattern: string,
    countToken: 'COUNT',
    count: number,
  ): Promise<[cursor: string, keys: string[]]>
  quit(): Promise<unknown>
}

export type RedisClientFactory = (
  redisUrl: string,
) => RedisClient | Promise<RedisClient>

// ioredis emits connection causes as events and rejects commands with a generic retry error.
const connectionErrors = new WeakMap<RedisClient, Error>()

// The host names the target without exposing credentials from the URL.
const describeTarget = (redisUrl: string): string =>
  URL.canParse(redisUrl) && new URL(redisUrl).host
    ? `Redis cache request to ${new URL(redisUrl).host}`
    : 'Redis cache request'

// Node reports a dual-stack connection failure as an AggregateError with an empty message.
const describeError = (error: unknown): string => {
  if (error instanceof AggregateError && !error.message) {
    return error.errors.map(describeError).join('; ')
  }
  return error instanceof Error ? error.message : String(error)
}

const createIoredisClient: RedisClientFactory = async (redisUrl) => {
  const { Redis } = await import('ioredis')

  // family 0 lets hostnames resolve to IPv6, which private networks such as Railway require.
  // One retry per command fails fast while ioredis keeps reconnecting in the background.
  const client = new Redis(redisUrl, {
    family: 0,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  })
  client.on('error', (error: Error) => connectionErrors.set(client, error))
  client.on('ready', () => connectionErrors.delete(client))
  return client
}

export interface RedisStoreOptions {
  namespace?: string
  client?: RedisClient
  createClient?: RedisClientFactory
}

export class RedisKvStore implements KvStore {
  readonly #namespace: string
  readonly #redisUrl: string
  readonly #target: string
  readonly #ownsClient: boolean
  readonly #createClient: RedisClientFactory
  #client: RedisClient | undefined
  #clientPromise: Promise<RedisClient> | undefined

  constructor(redisUrl: string, options: RedisStoreOptions = {}) {
    this.#namespace = options.namespace ?? DEFAULT_CACHE_NAMESPACE
    this.#redisUrl = redisUrl
    this.#target = describeTarget(redisUrl)
    this.#client = options.client
    this.#ownsClient = !options.client
    this.#createClient = options.createClient ?? createIoredisClient
  }

  async get(key: string): Promise<string | undefined> {
    const value = await this.#run((client) =>
      client.get(this.#physicalKey(key)),
    )
    return value ?? undefined
  }

  async put(
    key: string,
    value: string,
    options?: KvStorePutOptions,
  ): Promise<void> {
    const physicalKey = this.#physicalKey(key)
    const expiresAt = options?.expiresAt
    await this.#run((client) =>
      expiresAt === undefined
        ? client.set(physicalKey, value)
        : client.set(physicalKey, value, 'PXAT', expiresAt),
    )
  }

  async delete(key: string): Promise<void> {
    await this.#run((client) => client.del(this.#physicalKey(key)))
  }

  async *list(prefix = ''): AsyncIterable<string> {
    const physicalPrefix = createPhysicalPrefix(this.#namespace, prefix)
    let cursor = '0'

    do {
      const [nextCursor, keys] = await this.#run((client) =>
        client.scan(cursor, 'MATCH', `${physicalPrefix}*`, 'COUNT', 1000),
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

    const client = this.#client ?? (await this.#clientPromise)
    if (client) {
      await client.quit()
    }
  }

  async #run<T>(command: (client: RedisClient) => Promise<T>): Promise<T> {
    const client = await this.#getClient()

    try {
      return await command(client)
    } catch (error) {
      const reason = describeError(connectionErrors.get(client) ?? error)
      throw new Error(`${this.#target} failed: ${reason}`, { cause: error })
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
