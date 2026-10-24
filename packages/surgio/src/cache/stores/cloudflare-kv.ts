import {
  createPhysicalKey,
  createPhysicalPrefix,
  DEFAULT_CACHE_NAMESPACE,
  removePhysicalPrefix,
} from './utils.js'

import type { KvStore, KvStorePutOptions } from '../types.js'

export interface CloudflareKvNamespace {
  get(key: string): Promise<string | null>
  put(
    key: string,
    value: string,
    options?: { expiration?: number },
  ): Promise<void>
  delete(key: string): Promise<void>
  list(options?: {
    prefix?: string
    limit?: number
    cursor?: string
  }): Promise<{
    keys: Array<{ name: string }>
    list_complete: boolean
    cursor?: string
  }>
}

export interface CloudflareKvStoreOptions {
  namespace?: string
}

export class CloudflareKvStore implements KvStore {
  readonly #namespace: string

  constructor(
    readonly binding: CloudflareKvNamespace,
    options: CloudflareKvStoreOptions = {},
  ) {
    this.#namespace = options.namespace ?? DEFAULT_CACHE_NAMESPACE
  }

  async get(key: string): Promise<string | undefined> {
    return (await this.binding.get(this.#physicalKey(key))) ?? undefined
  }

  async put(
    key: string,
    value: string,
    options?: KvStorePutOptions,
  ): Promise<void> {
    const expiration =
      options?.expiresAt === undefined
        ? undefined
        : Math.max(
            Math.ceil(options.expiresAt / 1000),
            Math.ceil(Date.now() / 1000) + 60,
          )

    await this.binding.put(
      this.#physicalKey(key),
      value,
      expiration === undefined ? undefined : { expiration },
    )
  }

  async delete(key: string): Promise<void> {
    await this.binding.delete(this.#physicalKey(key))
  }

  async *list(prefix = ''): AsyncIterable<string> {
    const physicalPrefix = createPhysicalPrefix(this.#namespace, prefix)
    let cursor: string | undefined

    do {
      const result = await this.binding.list({
        prefix: physicalPrefix,
        limit: 1000,
        ...(cursor ? { cursor } : {}),
      })

      for (const key of result.keys) {
        yield removePhysicalPrefix(this.#namespace, key.name)
      }

      cursor = result.list_complete ? undefined : result.cursor
      if (!result.list_complete && !cursor) {
        throw new Error('Cloudflare KV list response is missing a cursor')
      }
    } while (cursor)
  }

  async close(): Promise<void> {}

  #physicalKey(key: string): string {
    return createPhysicalKey(this.#namespace, key)
  }
}

export const createCloudflareKvStore = (
  binding: CloudflareKvNamespace,
  options?: CloudflareKvStoreOptions,
): KvStore => new CloudflareKvStore(binding, options)
