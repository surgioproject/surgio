import { URL } from 'url'
import { createLogger } from '@surgio/logger'

import { NodeTypeEnum, ShadowsocksNodeConfig } from '../types'

import { decodeStringList, fromUrlSafeBase64 } from './index'

const logger = createLogger({ service: 'surgio:utils:ss' })

export const parseSSUri = (str: string): ShadowsocksNodeConfig => {
  logger.debug('Shadowsocks URI', str)

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
    userInfo = fromUrlSafeBase64(decodeURIComponent(scheme.username)).split(':')
  }
  const pluginInfo =
    typeof pluginString === 'string'
      ? decodeStringList(pluginString.split(';'))
      : {}

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
        const [legacyMethod, legacyPassword] = cred.split(':')
        const [legacyHost, legacyPort] = hostPort.split(':')
        if (legacyMethod && legacyPassword && legacyHost && legacyPort) {
          userInfo = [legacyMethod, legacyPassword]
          // 覆盖 hostname、port
          scheme.hostname = legacyHost
          scheme.port = legacyPort
        }
      }
    } catch (_) {
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
          obfsHost: pluginInfo.host + '',
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
