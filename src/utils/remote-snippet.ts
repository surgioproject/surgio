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

import {
  getNetworkConcurrency,
  getRemoteSnippetCacheMaxage,
} from './env-flag.js'
import httpClient from './http-client.js'

import { toMD5 } from './index.js'

import type { Logger } from '@surgio/logger'
import type { TtlCache } from '../cache/core.js'
import type { RuntimeHttpClient } from '../runtime/types.js'

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

  function load(url: string): Promise<string> {
    return client
      .get(url)
      .then((data) => {
        runtimeLogger.info(`远程片段下载成功：${url}`)
        return data.body
      })
      .catch((err) => {
        runtimeLogger.error(`远程片段下载失败：${url}`)
        throw err
      })
  }

  return Bluebird.map(
    remoteSnippetList,
    async (item) => {
      const fileMd5 = toMD5(item.url)
      const isSurgioSnippet = item.surgioSnippet

      const cacheKey = `${CACHE_KEYS.RemoteSnippets}:${fileMd5}`
      const cachedSnippet = await cache.get<string>(cacheKey)
      const snippet: string =
        cachedSnippet !== undefined
          ? cachedSnippet
          : await load(item.url)
              .then((res) => {
                return Promise.all([
                  cache.set(
                    cacheKey,
                    res,
                    cacheSnippet
                      ? (runtime.cacheTtl ?? getRemoteSnippetCacheMaxage())
                      : ms('1m'),
                  ),
                  res,
                ])
              })
              .then(([, res]) => res)

      return {
        main: (...args: string[]) =>
          isSurgioSnippet
            ? renderSurgioSnippet(snippet, args)
            : addProxyToSurgeRuleSet(snippet, args[0]),
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
