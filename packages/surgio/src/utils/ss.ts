import { URL } from 'url'
import { logger } from '@surgio/logger'

import { NodeTypeEnum, ShadowsocksNodeConfig } from '../types.js'

import { fromUrlSafeBase64 } from './portable.js'

import type { Logger } from '@surgio/logger'

export const parseSSUri = (
  str: string,
  runtimeLogger: Logger = logger,
): ShadowsocksNodeConfig => {
  runtimeLogger.debug('Shadowsocks URI', str)

  const scheme = new URL(str)
  const pluginString = scheme.searchParams.get('plugin')

  // SIP002 兼容：若 URL 已经拆分出 username/password，则说明 userinfo 为明文形式
  let userInfo: string[]
  if (scheme.password) {
    userInfo = [
      decodeURIComponent(scheme.username),
      decodeURIComponent(scheme.password),
    ]
  } else {
    const decoded = fromUrlSafeBase64(decodeURIComponent(scheme.username))
    const colonIndex = decoded.indexOf(':')
    userInfo =
      colonIndex > -1
        ? [decoded.slice(0, colonIndex), decoded.slice(colonIndex + 1)]
        : [decoded]
  }
  const pluginInfo =
    typeof pluginString === 'string' ? parseSip003Options(pluginString) : {}

  // SIP001 兼容：如果未能正确取得 method 或 password，且未出现 '@'，尝试解析整段 Base64 主机名
  if (!userInfo[0] || userInfo.length < 2) {
    try {
      const legacyStr = fromUrlSafeBase64(scheme.hostname)
      // legacyStr 形如 method:password@host:port
      const atIndex = legacyStr.indexOf('@')
      if (atIndex > 0) {
        const [cred, hostPort] = [
          legacyStr.slice(0, atIndex),
          legacyStr.slice(atIndex + 1),
        ]
        const credColonIndex = cred.indexOf(':')
        const legacyMethod =
          credColonIndex > -1 ? cred.slice(0, credColonIndex) : cred
        const legacyPassword =
          credColonIndex > -1 ? cred.slice(credColonIndex + 1) : undefined
        const [legacyHost, legacyPort] = hostPort.split(':')
        if (legacyMethod && legacyPassword && legacyHost && legacyPort) {
          userInfo = [legacyMethod, legacyPassword]
          // 覆盖 hostname、port
          scheme.hostname = legacyHost
          scheme.port = legacyPort
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    type: NodeTypeEnum.Shadowsocks,
    nodeName: decodeURIComponent(scheme.hash.replace('#', '')),
    hostname: scheme.hostname,
    port: scheme.port,
    method: userInfo[0],
    password: userInfo[1],
    ...(pluginInfo['obfs-local']
      ? {
          obfs: pluginInfo.obfs as 'http' | 'tls',
          obfsHost: pluginInfo['obfs-host'] + '',
        }
      : null),
    ...(pluginInfo['simple-obfs']
      ? {
          obfs: pluginInfo.obfs as 'http' | 'tls',
          obfsHost: pluginInfo['obfs-host'] + '',
        }
      : null),
    ...(pluginInfo['v2ray-plugin']
      ? {
          obfs: pluginInfo.tls ? 'wss' : 'ws',
          ...(typeof pluginInfo.host === 'string'
            ? { obfsHost: pluginInfo.host }
            : null),
          ...(typeof pluginInfo.path === 'string'
            ? { obfsUri: pluginInfo.path }
            : null),
        }
      : null),
  }
}

// Marshal SIP003 plugin options in PossibleNodeConfigType to formatted string.
// An example is 'a=123;host=https://a.com/foo?bar\=baz&q\\q\=1&w\;w\=2;mode=quic;tls=true',
// where semicolons, equal signs and backslashes MUST be escaped with a backslash.
export const stringifySip003Options = (args?: Record<string, any>): string => {
  if (!args) {
    return ''
  }

  const keys = Object.keys(args).sort()
  const pairs: string[] = []
  for (const key of keys) {
    pairs.push(
      `${key.replace(/([;=\\])/g, '\\$1')}=${args[key]
        .toString()
        .replace(/([;=\\])/g, '\\$1')}`,
    )
  }
  return pairs.join(';')
}

export const parseSip003Options = (
  value: string,
): Record<string, string | boolean> => {
  const result: Record<string, string | boolean> = {}
  let key = ''
  let item = ''
  let hasSeparator = false
  let escaped = false

  const commit = (): void => {
    if (hasSeparator) result[key.trim()] = item.trim() || true
    else if (item.trim()) result[item.trim()] = true
    key = ''
    item = ''
    hasSeparator = false
  }

  for (const character of value) {
    if (escaped) {
      item += character
      escaped = false
    } else if (character === '\\') {
      escaped = true
    } else if (character === ';') {
      commit()
    } else if (character === '=' && !hasSeparator) {
      key = item
      item = ''
      hasSeparator = true
    } else {
      item += character
    }
  }
  if (escaped) item += '\\'
  commit()
  return result
}
