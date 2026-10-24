import { CACHE_KEYS } from '../constant/index.js'
import { toMD5 } from '../utils/portable.js'

import { mapConcurrent } from './artifact.js'
import { addProxyToRuleSet } from './ruleset.js'
import { parseRestrictedSnippet } from './snippet-interpreter.js'

import type { Logger } from '@surgio/logger'
import type { TtlCache } from '../cache/core.js'
import type { RemoteSnippet, RemoteSnippetConfig } from '../types.js'
import type { RestrictedSnippetMacro } from './snippet-interpreter.js'
import type { RuntimeHttpClient } from './types.js'

interface RemoteSnippetOptions {
  readonly cache: Pick<TtlCache, 'wrap'>
  readonly cacheTtl: number
  readonly concurrency: number
  readonly httpClient: RuntimeHttpClient
  readonly logger: Logger
}

export const loadRemoteSnippets = (
  configs: ReadonlyArray<RemoteSnippetConfig>,
  options: RemoteSnippetOptions,
): Promise<ReadonlyArray<RemoteSnippet>> => {
  const { cache, cacheTtl, concurrency, httpClient, logger } = options

  const download = async (url: string): Promise<string> => {
    try {
      const response = await httpClient.get(url)
      logger.info(`远程片段下载成功：${url}`)
      return response.body
    } catch (error) {
      logger.error(`远程片段下载失败：${url}`)
      throw error
    }
  }

  const load = (url: string): Promise<string> =>
    cache.wrap(
      `${CACHE_KEYS.RemoteSnippets}:${toMD5(url)}`,
      () => download(url),
      cacheTtl,
    )

  return mapConcurrent(configs, concurrency, async (config) => {
    const text = await load(config.url)
    let macro: RestrictedSnippetMacro | undefined

    return {
      name: config.name,
      url: config.url,
      text,
      main: (...args: string[]) => {
        if (config.surgioSnippet) {
          macro ??= parseRestrictedSnippet(text)
          return macro.render(args)
        }
        return addProxyToRuleSet(text, args[0])
      },
    }
  })
}
