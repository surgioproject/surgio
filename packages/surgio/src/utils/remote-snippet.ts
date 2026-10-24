import { logger } from '@surgio/logger'

import { unifiedCache } from '../cache/singleton.js'
import { RemoteSnippet, RemoteSnippetConfig } from '../types.js'
import {
  parseRestrictedSnippet,
  renderRestrictedSnippet,
} from '../runtime/snippet-interpreter.js'
import { addProxyToRuleSet } from '../runtime/ruleset.js'
import { httpClient } from '../runtime/http-client.js'
import { loadRemoteSnippets } from '../runtime/remote-snippet.js'

import {
  getNetworkConcurrency,
  getRemoteSnippetCacheMaxage,
} from './env-flag.js'

import type { Logger } from '@surgio/logger'
import type { TtlCache } from '../cache/core.js'
import type { RuntimeHttpClient } from '../runtime/types.js'

export interface RemoteSnippetRuntimeOptions {
  readonly cache?: Pick<TtlCache, 'wrap'>
  readonly cacheTtl?: number
  readonly concurrency?: number
  readonly httpClient?: RuntimeHttpClient
  readonly logger?: Logger
}

export const parseMacro = (
  snippet: string,
): {
  functionName: string
  arguments: string[]
} => {
  try {
    return {
      functionName: 'main',
      arguments: [...parseRestrictedSnippet(snippet).arguments],
    }
  } catch (error) {
    throw new Error('该片段不包含可用的宏', { cause: error })
  }
}

export const addProxyToSurgeRuleSet = (
  str: string,
  proxyName?: string,
): string => addProxyToRuleSet(str, proxyName)

export const renderSurgioSnippet = (str: string, args: string[]): string => {
  return renderRestrictedSnippet(str, args)
}

export const loadRemoteSnippetList = async (
  remoteSnippetList: ReadonlyArray<RemoteSnippetConfig>,
  cacheSnippet = true,
  runtime: RemoteSnippetRuntimeOptions = {},
): Promise<ReadonlyArray<RemoteSnippet>> => {
  return loadRemoteSnippets(remoteSnippetList, {
    cache: runtime.cache ?? unifiedCache,
    cacheTtl: cacheSnippet
      ? (runtime.cacheTtl ?? getRemoteSnippetCacheMaxage())
      : 60_000,
    concurrency: runtime.concurrency ?? getNetworkConcurrency(),
    httpClient: runtime.httpClient ?? httpClient,
    logger: runtime.logger ?? logger,
  })
}
