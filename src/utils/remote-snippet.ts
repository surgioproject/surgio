import Bluebird from 'bluebird'
import { logger } from '@surgio/logger'
import ms from 'ms'

import { unifiedCache } from '../cache/singleton.js'
import { CACHE_KEYS } from '../constant/index.js'
import { RemoteSnippet, RemoteSnippetConfig } from '../types.js'
import {
  parseRestrictedSnippet,
  renderRestrictedSnippet,
} from '../runtime/snippet-interpreter.js'
import { addProxyToRuleSet } from '../runtime/ruleset.js'
import { httpClient } from '../runtime/http-client.js'

import {
  getNetworkConcurrency,
  getRemoteSnippetCacheMaxage,
} from './env-flag.js'
import { toMD5 } from './portable.js'

import type { Logger } from '@surgio/logger'
import type { TtlCache } from '../cache/core.js'
import type { RuntimeHttpClient } from '../runtime/types.js'
import type { RestrictedSnippetMacro } from '../runtime/snippet-interpreter.js'

export interface RemoteSnippetRuntimeOptions {
  readonly cache?: Pick<TtlCache, 'get' | 'set'>
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
  const cache = runtime.cache ?? unifiedCache
  const client = runtime.httpClient ?? httpClient
  const runtimeLogger = runtime.logger ?? logger

  async function load(url: string): Promise<string> {
    try {
      const data = await client.get(url)
      runtimeLogger.info(`远程片段下载成功：${url}`)
      return data.body
    } catch (err) {
      runtimeLogger.error(`远程片段下载失败：${url}`)
      throw err
    }
  }

  return Bluebird.map(
    remoteSnippetList,
    async (item) => {
      const fileMd5 = toMD5(item.url)
      const isSurgioSnippet = item.surgioSnippet

      const cacheKey = `${CACHE_KEYS.RemoteSnippets}:${fileMd5}`
      let snippet = await cache.get<string>(cacheKey)
      if (snippet === undefined) {
        snippet = await load(item.url)
        await cache.set(
          cacheKey,
          snippet,
          cacheSnippet
            ? (runtime.cacheTtl ?? getRemoteSnippetCacheMaxage())
            : ms('1m'),
        )
      }

      let macro: RestrictedSnippetMacro | undefined

      return {
        main: (...args: string[]) => {
          if (isSurgioSnippet) {
            macro ??= parseRestrictedSnippet(snippet)
            return macro.render(args)
          }
          return addProxyToSurgeRuleSet(snippet, args[0])
        },
        name: item.name,
        url: item.url,
        text: snippet, // 原始内容
      }
    },
    {
      concurrency: runtime.concurrency ?? getNetworkConcurrency(),
    },
  )
}
