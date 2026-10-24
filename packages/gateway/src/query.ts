const blockedKeys = new Set(['__proto__', 'prototype', 'constructor'])

const keyParts = (key: string): string[] => {
  const parts = key.replaceAll('[', '.').replaceAll(']', '').split('.')
  return parts.filter((part, index) => part || index === parts.length - 1)
}

const assign = (
  target: Record<string, unknown>,
  key: string,
  value: string
): void => {
  const parts = keyParts(key)
  if (!parts.length || parts.some((part) => blockedKeys.has(part))) return

  if (parts.at(-1) === '') {
    const parent = parts.at(-2)
    if (!parent) return
    let container = target
    for (const part of parts.slice(0, -2)) {
      const existing = container[part]
      if (
        !existing ||
        typeof existing !== 'object' ||
        Array.isArray(existing)
      ) {
        container[part] = Object.create(null) as Record<string, unknown>
      }
      container = container[part] as Record<string, unknown>
    }
    const values = container[parent]
    container[parent] = Array.isArray(values) ? [...values, value] : [value]
    return
  }

  let current: Record<string, unknown> = target
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index]
    if (!part) continue
    const existing = current[part]
    if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
      current[part] = Object.create(null) as Record<string, unknown>
    }
    current = current[part] as Record<string, unknown>
  }

  const last = parts.at(-1)
  if (!last) return
  const existing = current[last]
  current[last] =
    existing === undefined
      ? value
      : Array.isArray(existing)
        ? [...existing, value]
        : [existing, value]
}

export const parseStructuredQuery = (url: URL): Record<string, unknown> => {
  const result = Object.create(null) as Record<string, unknown>
  for (const [key, value] of url.searchParams) assign(result, key, value)
  return result
}

export const omitQuery = (
  input: Readonly<Record<string, unknown>>,
  omitted: ReadonlyArray<string>
): Record<string, unknown> => {
  const result = Object.create(null) as Record<string, unknown>
  for (const [key, value] of Object.entries(input)) {
    if (!omitted.includes(key)) result[key] = value
  }
  return result
}

export const pickHeaders = (
  headers: Headers,
  allowed: ReadonlySet<string>
): Record<string, string> => {
  const result = Object.create(null) as Record<string, string>
  for (const [key, value] of headers) {
    const name = key.toLowerCase()
    if (allowed.has(name)) result[name] = value
  }
  return result
}

const sortValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, item]) => [key, sortValue(item)])
    )
  }
  return value
}

/** 让缓存 key 不受对象与 query 参数书写顺序影响。 */
export const stableStringify = (value: unknown): string =>
  JSON.stringify(sortValue(value))
