import { satisfies } from 'compare-versions'

/**
 * Exapmle:
 * isSurge('Surge iOS/2920')
 * isSurge('Surge/1129 CFNetwork/1335.0.3.2 Darwin/21.6.0')
 */
export const isSurgeIOS = (
  ua: string | undefined,
  version?: string,
): boolean => {
  if (!ua) {
    return false
  }

  const isClient = ua.toLowerCase().includes('surge ios')

  if (!isClient) {
    return false
  }

  if (!version) {
    return true
  }

  const matcher = /(surge ios)\/([\w\.]+)/i
  const result = matcher.exec(ua.toLowerCase())
  const clientVersion = result ? result[2] : ''

  try {
    return satisfies(clientVersion, version)
  } catch {
    return false
  }
}

/**
 * Exapmle:
 * isSurge('Surge Mac/2408')
 */
export const isSurgeMac = (
  ua: string | undefined,
  version?: string,
): boolean => {
  if (!ua) {
    return false
  }

  const isClient = ua.toLowerCase().includes('surge mac')

  if (!isClient) {
    return false
  }

  if (!version) {
    return true
  }

  const matcher = /(surge mac)\/([\w\.]+)/i
  const result = matcher.exec(ua.toLowerCase())
  const clientVersion = result ? result[2] : ''

  try {
    return satisfies(clientVersion, version)
  } catch {
    return false
  }
}

export const isClash = (ua: string | undefined, version?: string): boolean => {
  if (!ua) {
    return false
  }

  const isClient = ua.toLowerCase().includes('clash')

  if (!isClient) {
    return false
  }

  if (!version) {
    return true
  }

  const matcher = /(clash)\/([\w\.]+)/i
  const result = matcher.exec(ua.toLowerCase())
  const clientVersion = result ? result[2] : ''

  try {
    return satisfies(clientVersion, version)
  } catch {
    return false
  }
}

export const isStash = (ua: string | undefined, version?: string): boolean => {
  if (!ua) {
    return false
  }

  const isClient = ua.toLowerCase().includes('stash')

  if (!isClient) {
    return false
  }

  if (!version) {
    return true
  }

  const matcher = /(stash)\/([\w\.]+)/i
  const result = matcher.exec(ua.toLowerCase())
  const clientVersion = result ? result[2] : ''

  try {
    return satisfies(clientVersion, version)
  } catch {
    return false
  }
}

export const isQuantumultX = (
  ua: string | undefined,
  version?: string,
): boolean => {
  if (!ua) {
    return false
  }

  const isClient = ua.includes('Quantumult%20X')

  if (!isClient) {
    return false
  }

  if (!version) {
    return true
  }

  const matcher = /(Quantumult%20X)\/([\w\.]+)/i
  const result = matcher.exec(ua.toLowerCase())
  const clientVersion = result ? result[2] : ''

  try {
    return satisfies(clientVersion, version)
  } catch {
    return false
  }
}

export const isShadowrocket = (
  ua: string | undefined,
  version?: string,
): boolean => {
  if (!ua) {
    return false
  }

  const isClient = ua.includes('Shadowrocket')

  if (!isClient) {
    return false
  }

  if (!version) {
    return true
  }

  const matcher = /(Shadowrocket)\/([\w\.]+)/i
  const result = matcher.exec(ua.toLowerCase())
  const clientVersion = result ? result[2] : ''

  try {
    return satisfies(clientVersion, version)
  } catch {
    return false
  }
}

export const isLoon = (ua: string | undefined, version?: string): boolean => {
  if (!ua) {
    return false
  }

  const isClient = ua.includes('Loon')

  if (!isClient) {
    return false
  }

  if (!version) {
    return true
  }

  const matcher = /(Loon)\/([\w\.]+)/i
  const result = matcher.exec(ua.toLowerCase())
  const clientVersion = result ? result[2] : ''

  try {
    return satisfies(clientVersion, version)
  } catch {
    return false
  }
}
