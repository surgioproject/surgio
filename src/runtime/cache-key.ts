import { CACHE_KEYS } from '../constant/index.js'
import { toMD5 } from '../utils/portable.js'

import type { ArtifactConfig } from '../types.js'
import type { RenderArtifactOptions } from './public.js'

export type CacheKeyScope = 'node-runtime' | 'worker'

export type RenderedArtifactCacheKey =
  | { readonly cacheable: true; readonly key: string }
  | { readonly cacheable: false; readonly reason: string }

/**
 * `renderProviders` 构造的临时 Artifact 只把 Provider 名编进 `name`，模板名单独放在
 * `template` 上，两者都必须参与 key。
 */
export type CacheKeyArtifact = Pick<ArtifactConfig, 'name' | 'template'>

/**
 * 渲染参数中唯一允许参与缓存 key 的两个字段。其余字段（任意 URL query 参数）会被模板和
 * 自定义 Provider 以无法预知的方式消费，基数不可枚举。
 */
const ENUMERABLE_PARAM_KEYS = new Set(['requestUserAgent', 'requestHeaders'])

const sortObjectKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, item]) => [key, sortObjectKeys(item)]),
    )
  }

  return value
}

const normalizeDownloadUrl = (value: string): string => {
  try {
    const url = new URL(value)
    url.searchParams.sort()
    return url.toString()
  } catch {
    return value
  }
}

const normalizeHeaders = (value: unknown): unknown => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key.toLowerCase(),
      item,
    ]),
  )
}

const findUnknownParamKey = (
  params: Readonly<Record<string, unknown>> | undefined,
): string | undefined =>
  Object.keys(params ?? {}).find((key) => !ENUMERABLE_PARAM_KEYS.has(key))

export const buildRenderedArtifactCacheKey = (
  scope: CacheKeyScope,
  artifact: CacheKeyArtifact,
  options: RenderArtifactOptions = {},
): RenderedArtifactCacheKey => {
  if (typeof options.filter === 'function') {
    return {
      cacheable: false,
      reason: 'filter 是函数，无法参与缓存 key 计算',
    }
  }

  for (const [name, params] of [
    ['customParams', options.customParams],
    ['getNodeListParams', options.getNodeListParams],
  ] as const) {
    const unknownKey = findUnknownParamKey(params)

    if (unknownKey) {
      return {
        cacheable: false,
        reason: `${name}.${unknownKey} 的取值不可枚举`,
      }
    }
  }

  if (
    options.customParams?.requestUserAgent !== undefined ||
    options.getNodeListParams?.requestUserAgent !== undefined
  ) {
    return {
      cacheable: false,
      reason: 'requestUserAgent 参与渲染，客户端 UA 基数不可枚举',
    }
  }

  const payload = sortObjectKeys({
    artifact: artifact.name,
    downloadUrl:
      options.downloadUrl === undefined
        ? undefined
        : normalizeDownloadUrl(options.downloadUrl),
    filter: options.filter,
    format: options.format,
    requestHeaders: normalizeHeaders(
      options.getNodeListParams?.requestHeaders ??
        options.customParams?.requestHeaders,
    ),
    template: artifact.template,
  })

  return {
    cacheable: true,
    key: `${CACHE_KEYS.RenderedArtifact}:${scope}:${toMD5(JSON.stringify(payload))}`,
  }
}
