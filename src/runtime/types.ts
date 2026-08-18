import type { TtlCache } from '../cache/ttl-cache.js'
import type { CommandConfigAfterNormalize } from '../types.js'

export type RuntimeHeaderValue = string | string[] | undefined
export type RuntimeHeaders = Record<string, RuntimeHeaderValue>

export interface RuntimeHttpResponse {
  body: string
  headers: RuntimeHeaders
  statusCode: number
}

export interface RuntimeHttpClient {
  get(
    url: string,
    options?: { headers?: RuntimeHeaders },
  ): Promise<RuntimeHttpResponse>
}

export interface RuntimeLogger {
  debug(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
}

export interface ProviderRuntimeContext {
  readonly cache: Pick<TtlCache, 'get' | 'set' | 'wrap'>
  readonly config: Pick<CommandConfigAfterNormalize, 'gateway'>
  readonly httpClient: RuntimeHttpClient
  readonly logger: RuntimeLogger
  readonly providerCacheTtl: number
  readonly version: string
}

export type RuntimeDomainResolver = (
  domain: string,
  timeout?: number,
) => Promise<ReadonlyArray<string>>

export interface RuntimeNetworkOptions {
  artifactCacheTtl?: number
  concurrency?: number
  providerCacheTtl?: number
  remoteSnippetCacheTtl?: number
  retry?: number
  timeout?: number
}
