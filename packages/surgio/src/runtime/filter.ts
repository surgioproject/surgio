import { internalFilters } from '../filters/index.js'

import type { NodeFilterType, SortedNodeFilterType } from '../types.js'

type AnyFilter = NodeFilterType | SortedNodeFilterType

const CUSTOM_FILTER_PREFIX = 'customFilters.'

/** 请求中的过滤器名称无法解析。网关据此返回 400 而不是 500。 */
export class UnknownFilterError extends Error {
  constructor(readonly filterName: string) {
    super(`Filter ${filterName} 不存在`)
    this.name = 'UnknownFilterError'
  }
}

export interface FilterScope {
  /** 已按 config < provider < artifact 优先级合并的自定义过滤器。 */
  readonly customFilters: Readonly<Record<string, AnyFilter | undefined>>
  /** 主 Provider 对内置过滤器的覆盖，与模板变量保持一致。 */
  readonly providerOverrides: Readonly<{
    netflixFilter?: AnyFilter
    youtubePremiumFilter?: AnyFilter
  }>
}

const ownValue = <T>(
  record: Readonly<Record<string, T | undefined>>,
  key: string,
): T | undefined => (Object.hasOwn(record, key) ? record[key] : undefined)

/**
 * 按模板里的写法解析过滤器名称。`customFilters.xxx` 只查自定义过滤器。
 * 裸名称先查自定义过滤器，再查内置过滤器，以兼容 v3 的链接和 v4 的旧写法。
 */
export const resolveFilterByName = (
  name: string,
  scope: FilterScope,
): AnyFilter => {
  const filter = name.startsWith(CUSTOM_FILTER_PREFIX)
    ? ownValue(scope.customFilters, name.slice(CUSTOM_FILTER_PREFIX.length))
    : (ownValue(scope.customFilters, name) ??
      ownValue(scope.providerOverrides, name) ??
      ownValue<AnyFilter>(internalFilters, name))
  if (!filter) throw new UnknownFilterError(name)
  return filter
}
