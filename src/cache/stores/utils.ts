export const DEFAULT_CACHE_NAMESPACE = 'surgio'
export const KEY_SEPARATOR = ':'

export const createPhysicalKey = (namespace: string, key: string): string =>
  `${namespace}${KEY_SEPARATOR}${key}`

export const createPhysicalPrefix = (namespace: string, prefix = ''): string =>
  createPhysicalKey(namespace, prefix)

export const removePhysicalPrefix = (
  namespace: string,
  physicalKey: string,
): string => physicalKey.slice(createPhysicalPrefix(namespace).length)
