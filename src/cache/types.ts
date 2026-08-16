export interface KvStorePutOptions {
  /** Absolute Unix timestamp in milliseconds used for physical cleanup. */
  expiresAt?: number
}

export interface KvStore {
  get(key: string): Promise<string | undefined>
  put(key: string, value: string, options?: KvStorePutOptions): Promise<void>
  delete(key: string): Promise<void>
  list(prefix?: string): AsyncIterable<string>
  close(): Promise<void>
}

export type CacheType = 'filesystem' | 'redis' | 'upstash' | 'custom'

export interface PreparedKvStore {
  store: KvStore
  type: CacheType
}
