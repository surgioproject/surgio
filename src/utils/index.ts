import { createLogger } from '@surgio/logger'
import fs from 'fs-extra'
import os from 'os'
import { join } from 'path'
import queryString from 'query-string'
import { JsonObject } from 'type-fest'
import { URL, URLSearchParams } from 'url'
import URLSafeBase64 from 'urlsafe-base64'
import net from 'net'
import crypto from 'crypto'
import { camelCase, snakeCase, paramCase } from 'change-case'

import {
  NodeFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  ShadowsocksNodeConfig,
  ShadowsocksrNodeConfig,
  SortedNodeFilterType,
  VmessNodeConfig,
} from '../types'
import { ERR_INVALID_FILTER, OBFS_UA } from '../constant'
import { getIsGFWFree } from './env-flag'
import { applyFilter } from './filter'

export * from './surge'
export * from './surfboard'
export * from './clash'
export * from './quantumult'
export * from './loon'
export * from './remote-snippet'
export * from './subscription'
export * from './time'
export * from './errors'
export { default as httpClient } from './http-client'

const logger = createLogger({ service: 'surgio:utils' })

export const getDownloadUrl = (
  baseUrl = '/',
  artifactName: string,
  inline = true,
  accessToken?: string,
): string => {
  let urlSearchParams: URLSearchParams
  let name: string

  if (artifactName.includes('?')) {
    urlSearchParams = new URLSearchParams(artifactName.split('?')[1])
    name = artifactName.split('?')[0]
  } else {
    urlSearchParams = new URLSearchParams()
    name = artifactName
  }

  if (accessToken) {
    urlSearchParams.set('access_token', accessToken)
  }
  if (!inline) {
    urlSearchParams.set('dl', '1')
  }

  const query = urlSearchParams.toString()

  return `${baseUrl}${name}${query ? '?' + query : ''}`
}

export const getUrl = (
  baseUrl: string,
  path: string,
  accessToken?: string,
): string => {
  path = path.replace(/^\//, '')
  const url = new URL(path, baseUrl)
  if (accessToken) {
    url.searchParams.set('access_token', accessToken)
  }
  return url.toString()
}

// istanbul ignore next
export const toUrlSafeBase64 = (str: string): string =>
  URLSafeBase64.encode(Buffer.from(str, 'utf8'))

// istanbul ignore next
export const fromUrlSafeBase64 = (str: string): string => {
  if (URLSafeBase64.validate(str)) {
    return URLSafeBase64.decode(str).toString()
  }
  return fromBase64(str)
}

// istanbul ignore next
export const toBase64 = (str: string): string =>
  Buffer.from(str, 'utf8').toString('base64')

// istanbul ignore next
export const fromBase64 = (str: string): string =>
  Buffer.from(str, 'base64').toString('utf8')

// istanbul ignore next
export const toMD5 = (str: string): string =>
  crypto.createHash('md5').update(str).digest('hex')

/**
 * @see https://github.com/shadowsocks/shadowsocks-org/wiki/SIP002-URI-Scheme
 */
export const getShadowsocksNodes = (
  list: ReadonlyArray<ShadowsocksNodeConfig>,
  groupName = 'Surgio',
): string => {
  const result: ReadonlyArray<any> = list
    .map((nodeConfig) => {
      // istanbul ignore next
      if (nodeConfig.enable === false) {
        return null
      }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          const query: {
            readonly plugin?: string
            readonly group?: string
          } = {
            ...(nodeConfig.obfs
              ? {
                  plugin: `${encodeURIComponent(
                    `obfs-local;obfs=${nodeConfig.obfs};obfs-host=${nodeConfig.obfsHost}`,
                  )}`,
                }
              : null),
            ...(groupName ? { group: encodeURIComponent(groupName) } : null),
          }

          return [
            'ss://',
            toUrlSafeBase64(`${nodeConfig.method}:${nodeConfig.password}`),
            '@',
            nodeConfig.hostname,
            ':',
            nodeConfig.port,
            '/?',
            queryString.stringify(query, {
              encode: false,
              sort: false,
            }),
            '#',
            encodeURIComponent(nodeConfig.nodeName),
          ].join('')
        }

        // istanbul ignore next
        default:
          logger.warn(
            `在生成 Shadowsocks 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`,
          )
          return null
      }
    })
    .filter((item) => !!item)

  return result.join('\n')
}

export const getShadowsocksrNodes = (
  list: ReadonlyArray<ShadowsocksrNodeConfig>,
  groupName: string,
): string => {
  const result: ReadonlyArray<string | undefined> = list
    .map((nodeConfig) => {
      // istanbul ignore next
      if (nodeConfig.enable === false) {
        return void 0
      }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocksr: {
          const baseUri = [
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.protocol,
            nodeConfig.method,
            nodeConfig.obfs,
            toUrlSafeBase64(nodeConfig.password),
          ].join(':')
          const query = {
            obfsparam: toUrlSafeBase64(nodeConfig.obfsparam),
            protoparam: toUrlSafeBase64(nodeConfig.protoparam),
            remarks: toUrlSafeBase64(nodeConfig.nodeName),
            group: toUrlSafeBase64(groupName),
            udpport: 0,
            uot: 0,
          }

          return (
            'ssr://' +
            toUrlSafeBase64(
              [
                baseUri,
                '/?',
                queryString.stringify(query, {
                  encode: false,
                }),
              ].join(''),
            )
          )
        }

        // istanbul ignore next
        default:
          logger.warn(
            `在生成 Shadowsocksr 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`,
          )
          return void 0
      }
    })
    .filter((item) => item !== undefined)

  return result.join('\n')
}

export const getV2rayNNodes = (
  list: ReadonlyArray<VmessNodeConfig>,
): string => {
  const result: ReadonlyArray<string> = list
    .map((nodeConfig): string | undefined => {
      // istanbul ignore next
      if (nodeConfig.enable === false) {
        return void 0
      }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Vmess: {
          const json = {
            v: '2',
            ps: nodeConfig.nodeName,
            add: nodeConfig.hostname,
            port: `${nodeConfig.port}`,
            id: nodeConfig.uuid,
            aid: nodeConfig.alterId,
            net: nodeConfig.network,
            type: 'none',
            host: nodeConfig.host,
            path: nodeConfig.path,
            tls: nodeConfig.tls ? 'tls' : '',
          }

          return 'vmess://' + toBase64(JSON.stringify(json))
        }

        // istanbul ignore next
        default:
          logger.warn(
            `在生成 V2Ray 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`,
          )
          return void 0
      }
    })
    .filter((item): item is string => item !== undefined)

  return result.join('\n')
}

// istanbul ignore next
export const getShadowsocksNodesJSON = (
  list: ReadonlyArray<ShadowsocksNodeConfig>,
): string => {
  const nodes: ReadonlyArray<any> = list
    .map((nodeConfig) => {
      // istanbul ignore next
      if (nodeConfig.enable === false) {
        return null
      }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          const useObfs = Boolean(nodeConfig.obfs && nodeConfig.obfsHost)
          return {
            remarks: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            server_port: nodeConfig.port,
            method: nodeConfig.method,
            remarks_base64: toUrlSafeBase64(nodeConfig.nodeName),
            password: nodeConfig.password,
            tcp_over_udp: false,
            udp_over_tcp: false,
            enable: true,
            ...(useObfs
              ? {
                  plugin: 'obfs-local',
                  'plugin-opts': `obfs=${nodeConfig.obfs};obfs-host=${nodeConfig.obfsHost}`,
                }
              : null),
          }
        }

        // istanbul ignore next
        default:
          logger.warn(
            `在生成 Shadowsocks 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`,
          )
          return undefined
      }
    })
    .filter((item) => item !== undefined)

  return JSON.stringify(nodes, null, 2)
}

export const getNodeNames = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  separator?: string,
): string {
  // istanbul ignore next
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER)
  }

  return applyFilter(list, filter)
    .map((item) => item.nodeName)
    .join(separator || ', ')
}

// istanbul ignore next
export const changeCase = (
  str: string,
  format: 'camelCase' | 'snakeCase' | 'kebabCase',
): string => {
  switch (format) {
    case 'camelCase':
      return camelCase(str)
    case 'snakeCase':
      return snakeCase(str)
    case 'kebabCase':
      return paramCase(str)
  }
}

export const pickAndFormatStringList = (
  obj: Record<string, any>,
  keyList: readonly string[],
  options: {
    keyFormat?: 'camelCase' | 'snakeCase' | 'kebabCase'
  } = {},
): readonly string[] => {
  const result: string[] = []

  keyList.forEach((key) => {
    if (obj.hasOwnProperty(key)) {
      const propertyKey = options.keyFormat
        ? changeCase(key, options.keyFormat)
        : key
      const propertyValue = obj[key]

      if (Array.isArray(propertyValue)) {
        result.push(`${propertyKey}=${propertyValue.join(',')}`)
      } else {
        result.push(`${propertyKey}=${propertyValue}`)
      }
    }
  })

  return result
}

export const pickAndFormatKeys = (
  obj: Record<string, any>,
  keyList: readonly string[],
  options: {
    keyFormat?: 'camelCase' | 'snakeCase' | 'kebabCase'
  } = {},
): Record<string, any> => {
  const result: Record<string, any> = {}

  keyList.forEach((key) => {
    if (obj.hasOwnProperty(key)) {
      const propertyKey = options.keyFormat
        ? changeCase(key, options.keyFormat)
        : key
      result[propertyKey] = obj[key]
    }
  })

  return result
}

export const decodeStringList = <T = Record<string, string | boolean>>(
  stringList: ReadonlyArray<string>,
): T => {
  const result: Record<string, any> = {}

  stringList.forEach((item) => {
    if (item.includes('=')) {
      const match = item.match(/^(.*?)=(.*?)$/)

      if (match) {
        const key = match[1].trim()
        const value = match[2].trim()
        result[key] = value || true
      }
    } else {
      result[item.trim()] = true
    }
  })
  return result as T
}

export const ensureConfigFolder = (dir: string = os.homedir()): string => {
  let baseDir

  try {
    fs.accessSync(dir, fs.constants.W_OK)
    baseDir = dir
  } catch (err) {
    // if the user do not have write permission
    // istanbul ignore next
    baseDir = '/tmp'
  }

  const configDir = join(baseDir, '.config/surgio')
  fs.mkdirpSync(configDir)
  return configDir
}

export const formatV2rayConfig = (
  localPort: number,
  nodeConfig: VmessNodeConfig,
): JsonObject => {
  const config: any = {
    log: {
      loglevel: 'warning',
    },
    inbound: {
      port: Number(localPort),
      listen: '127.0.0.1',
      protocol: 'socks',
      settings: {
        auth: 'noauth',
      },
    },
    outbound: {
      protocol: 'vmess',
      settings: {
        vnext: [
          {
            address: nodeConfig.hostname,
            port: Number(nodeConfig.port),
            users: [
              {
                id: nodeConfig.uuid,
                alterId: Number(nodeConfig.alterId),
                security: nodeConfig.method,
                level: 0,
              },
            ],
          },
        ],
      },
      streamSettings: {
        security: 'none',
      },
    },
  }

  if (nodeConfig.tls) {
    config.outbound.streamSettings = {
      ...config.outbound.streamSettings,
      security: 'tls',
      tlsSettings: {
        serverName: nodeConfig.host || nodeConfig.hostname,
        ...(typeof nodeConfig.skipCertVerify === 'boolean'
          ? {
              allowInsecure: nodeConfig.skipCertVerify,
            }
          : null),
        ...(typeof nodeConfig.tls13 === 'boolean'
          ? {
              allowInsecureCiphers: !nodeConfig.tls13,
            }
          : null),
      },
    }
  }

  if (nodeConfig.network === 'ws') {
    config.outbound.streamSettings = {
      ...config.outbound.streamSettings,
      network: nodeConfig.network,
      wsSettings: {
        path: nodeConfig.path,
        headers: {
          Host: nodeConfig.host,
          'User-Agent': OBFS_UA,
        },
      },
    }
  }

  return config
}

export const lowercaseHeaderKeys = (
  headers: Record<string, string>,
): Record<string, string> => {
  const wsHeaders: Record<string, string> = {}

  Object.keys(headers).forEach((key) => {
    wsHeaders[key.toLowerCase()] = headers[key]
  })

  return wsHeaders
}

// istanbul ignore next
export const isIp = (str: string): boolean => net.isIPv4(str) || net.isIPv6(str)

// istanbul ignore next
export const isNow = (): boolean =>
  typeof process.env.NOW_REGION !== 'undefined' ||
  typeof process.env.VERCEL_REGION !== 'undefined'

// istanbul ignore next
export const isVercel = (): boolean => isNow()

// istanbul ignore next
export const isHeroku = (): boolean => typeof process.env.DYNO !== 'undefined'

// istanbul ignore next
export const isGitHubActions = (): boolean =>
  typeof process.env.GITHUB_ACTIONS !== 'undefined'

// istanbul ignore next
export const isGitLabCI = (): boolean =>
  typeof process.env.GITLAB_CI !== 'undefined'

// istanbul ignore next
export const isRailway = (): boolean =>
  typeof process.env.RAILWAY_STATIC_URL !== 'undefined'

// istanbul ignore next
export const isNetlify = (): boolean =>
  typeof process.env.NETLIFY !== 'undefined'

// istanbul ignore next
export const isAWSLambda = (): boolean =>
  typeof process.env.AWS_LAMBDA_FUNCTION_NAME !== 'undefined'

// istanbul ignore next
export const isAWS = (): boolean =>
  isAWSLambda() ||
  typeof process.env.AWS_EXECUTION_ENV !== 'undefined' ||
  typeof process.env.AWS_REGION !== 'undefined'

// istanbul ignore next
export const isFlyIO = (): boolean =>
  typeof process.env.FLY_REGION !== 'undefined'

// istanbul ignore next
export const isGFWFree = (): boolean =>
  getIsGFWFree() ||
  isAWS() ||
  isAWSLambda() ||
  isVercel() ||
  isHeroku() ||
  isGitHubActions() ||
  isGitLabCI() ||
  isRailway() ||
  isNetlify() ||
  isFlyIO()

// istanbul ignore next
export const assertNever = (x: never): never => {
  throw new TypeError(`Unexpected object: ${x}`)
}

export const checkNotNullish = (val: unknown): boolean =>
  val !== null && val !== undefined

export const getPortFromHost = (host: string): number => {
  const match = host.match(/:(\d+)$/)
  if (match) {
    return Number(match[1])
  }
  throw new Error(`Invalid host: ${host}`)
}
