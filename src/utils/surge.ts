import { logger as defaultLogger } from '@surgio/logger'

import { OBFS_UA, SURGE_SUPPORTED_VMESS_NETWORK } from '../constant/index.js'
import {
  NodeFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  SortedNodeFilterType,
} from '../types.js'
import { applyFilter } from '../filters/index.js'

import { pickAndFormatStringList } from './portable.js'

import type { Logger } from '@surgio/logger'
import type { FormatterOptions } from '../runtime/types.js'

export const getSurgeExtendHeaders = (
  headers: Record<string, string>,
): string => {
  return Object.keys(headers)
    .map((headerKey) => `${headerKey.toLowerCase()}:${headers[headerKey]}`)
    .join('|')
}

interface SurgeNode {
  name: string
  proxy: string
  wireguard?: string
}

function formatNodes(
  nodeList: ReadonlyArray<PossibleNodeConfigType>,
  filter: NodeFilterType | SortedNodeFilterType | undefined,
  options: FormatterOptions,
): SurgeNode[] {
  const logger = options.logger ?? defaultLogger

  return applyFilter(nodeList, filter).flatMap((nodeConfig) => {
    const mapped = nodeListMapper(nodeConfig, logger)

    if (!mapped) {
      return []
    }

    const [name, policy] = mapped

    return [
      {
        name,
        proxy:
          nodeConfig.type === NodeTypeEnum.Tailscale
            ? policy
            : appendCommonConfig(policy, nodeConfig),
        wireguard:
          nodeConfig.type === NodeTypeEnum.Wireguard
            ? formatWireguardSection(nodeConfig)
            : undefined,
      },
    ]
  })
}

/**
 * @see https://manual.nssurge.com/policy/proxy.html
 */
export const getSurgeNodes = function (
  nodeList: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  options: FormatterOptions = {},
): string {
  const logger = options.logger ?? defaultLogger

  return formatNodes(nodeList, filter, options)
    .map((node) => {
      if (node.wireguard !== undefined) {
        logger.info(
          `请配合使用 getSurgeWireguardNodes 生成 ${node.name} 节点配置`,
        )
      }

      return node.proxy
    })
    .join('\n')
}

/**
 * 生成独立的 `[WireGuard ...]` 配置段，与 getSurgeNodes 输出的 section-name 引用配套使用。
 * 两者必须使用相同的节点列表和过滤器。
 */
export const getSurgeWireguardNodes = (
  nodeList: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  options: FormatterOptions = {},
): string =>
  formatNodes(nodeList, filter, options)
    .flatMap((node) => (node.wireguard === undefined ? [] : [node.wireguard]))
    .join('\n\n')

function formatWireguardSection(
  nodeConfig: Extract<PossibleNodeConfigType, { type: NodeTypeEnum.Wireguard }>,
): string {
  const nodeConfigSection: string[] = [
    `[WireGuard ${nodeConfig.nodeName}]`,
    `self-ip=${nodeConfig.selfIp}`,
    `private-key=${nodeConfig.privateKey}`,
  ]
  const optionalKeys: Array<keyof typeof nodeConfig> = [
    'mtu',
    'preferIpv6',
    'selfIpV6',
  ]

  for (const key of optionalKeys) {
    if (nodeConfig[key] !== undefined) {
      nodeConfigSection.push(
        ...pickAndFormatStringList(nodeConfig, [key], {
          keyFormat: 'kebabCase',
        }),
      )
    }
  }

  if (nodeConfig.dnsServers) {
    nodeConfigSection.push(
      `dns-server=${JSON.stringify(nodeConfig.dnsServers.join(', '))}`,
    )
  }

  const peerList: string[] = []

  for (const peer of nodeConfig.peers) {
    const peerConfig: string[] = [
      `endpoint=${peer.endpoint}`,
      `public-key=${JSON.stringify(peer.publicKey)}`,
    ]
    const optionalPeerConfigKeys: Array<keyof typeof peer> = [
      'presharedKey',
      'allowedIps',
      'keepalive',
    ]

    for (const key of optionalPeerConfigKeys) {
      if (peer[key] !== undefined) {
        peerConfig.push(
          ...pickAndFormatStringList(peer, [key], {
            keyFormat: 'kebabCase',
            stringifyValue: true,
          }),
        )
      }
    }

    /* istanbul ignore next -- @preserve */
    if (peer.reservedBits) {
      peerConfig.push(`client-id=${peer.reservedBits.join('/')}`)
    }

    peerList.push(`(${peerConfig.join(', ')})`)
  }

  nodeConfigSection.push(`peer=${peerList.join(', ')}`)

  return nodeConfigSection.join('\n')
}

export const getSurgeTailscaleNodes = (
  nodeList: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
): string => {
  return applyFilter(nodeList, filter)
    .map((nodeConfig) => {
      if (nodeConfig.type !== NodeTypeEnum.Tailscale) {
        return undefined
      }

      assertSurgeTailscaleAuthKey(nodeConfig)

      const nodeConfigSection = [
        `[Tailscale ${nodeConfig.nodeName}]`,
        `auth-key=${nodeConfig.authKey}`,
        ...pickAndFormatStringList(
          nodeConfig,
          [
            'controlUrl',
            'hostname',
            'derpOnly',
            'exitNode',
            'idleKeepalive',
            'preferIpv6',
          ],
          { keyFormat: 'kebabCase' },
        ),
      ]

      if (nodeConfig.dnsServers) {
        nodeConfigSection.push(`dns-server=${nodeConfig.dnsServers.join(', ')}`)
      }
      if (nodeConfig.mtu !== undefined) {
        nodeConfigSection.push(`mtu=${nodeConfig.mtu}`)
      }

      return nodeConfigSection.join('\n')
    })
    .filter((item): item is string => item !== undefined)
    .join('\n\n')
}

export const getSurgeNodeNames = (
  nodeList: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  options: FormatterOptions = {},
): string =>
  formatNodes(nodeList, filter, options)
    .map((node) => node.name)
    .join(', ')

function nodeListMapper(
  nodeConfig: PossibleNodeConfigType,
  logger: Logger,
): [string, string] | undefined {
  switch (nodeConfig.type) {
    case NodeTypeEnum.Shadowsocks: {
      if (nodeConfig.obfs && ['ws', 'wss'].includes(nodeConfig.obfs)) {
        logger.warn(
          `不支持为 Surge 生成 v2ray-plugin 的 Shadowsocks 节点，节点 ${nodeConfig.nodeName} 会被省略`,
        )
        return void 0
      }

      return [
        nodeConfig.nodeName,
        [
          nodeConfig.nodeName,
          [
            'ss',
            nodeConfig.hostname,
            nodeConfig.port,
            'encrypt-method=' + nodeConfig.method,
            ...pickAndFormatStringList(
              nodeConfig,
              ['password', 'udpRelay', 'obfs', 'obfsHost'],
              {
                keyFormat: 'kebabCase',
              },
            ),
          ].join(', '),
        ].join(' = '),
      ]
    }

    case NodeTypeEnum.HTTPS: {
      return [
        nodeConfig.nodeName,
        [
          nodeConfig.nodeName,
          [
            'https',
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.username /* istanbul ignore next -- @preserve */ || '',
            nodeConfig.password /* istanbul ignore next -- @preserve */ || '',
          ].join(', '),
        ].join(' = '),
      ]
    }

    case NodeTypeEnum.HTTP: {
      return [
        nodeConfig.nodeName,
        [
          nodeConfig.nodeName,
          [
            'http',
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.username /* istanbul ignore next -- @preserve */ || '',
            nodeConfig.password /* istanbul ignore next -- @preserve */ || '',
          ].join(', '),
        ].join(' = '),
      ]
    }

    case NodeTypeEnum.Snell: {
      return [
        nodeConfig.nodeName,
        [
          nodeConfig.nodeName,
          [
            'snell',
            nodeConfig.hostname,
            nodeConfig.port,
            ...pickAndFormatStringList(
              nodeConfig,
              ['psk', 'obfs', 'obfsHost', 'version', 'reuse', 'ipVersion'],
              {
                keyFormat: 'kebabCase',
              },
            ),
          ].join(', '),
        ].join(' = '),
      ]
    }

    case NodeTypeEnum.Vmess: {
      if (!SURGE_SUPPORTED_VMESS_NETWORK.includes(nodeConfig.network as any)) {
        logger.warn(
          `Surge 不支持 Vmess ${nodeConfig.network} 节点，节点 ${nodeConfig.nodeName} 会被省略`,
        )
        return undefined
      }

      const result = [
        'vmess',
        nodeConfig.hostname,
        nodeConfig.port,
        `username=${nodeConfig.uuid}`,
      ]

      if (['chacha20-poly1305', 'aes-128-gcm'].includes(nodeConfig.method)) {
        if (nodeConfig.method === 'chacha20-poly1305') {
          result.push(`encrypt-method=chacha20-ietf-poly1305`)
        } else {
          result.push(`encrypt-method=${nodeConfig.method}`)
        }
      }

      if (nodeConfig.network === 'ws') {
        result.push('ws=true')

        result.push(`ws-path=${nodeConfig.wsOpts?.path || '/'}`)
        result.push(
          'ws-headers=' +
            JSON.stringify(
              getSurgeExtendHeaders({
                'user-agent': OBFS_UA,
                ...nodeConfig.wsOpts?.headers,
              }),
            ),
        )
      }

      if (nodeConfig.tls) {
        result.push('tls=true')
      }

      if (nodeConfig?.surgeConfig?.vmessAEAD) {
        result.push('vmess-aead=true')
      } else {
        result.push('vmess-aead=false')
      }

      return [
        nodeConfig.nodeName,
        [nodeConfig.nodeName, result.join(', ')].join(' = '),
      ]
    }

    case NodeTypeEnum.Trojan: {
      const result: string[] = [
        'trojan',
        nodeConfig.hostname,
        `${nodeConfig.port}`,
        `password=${nodeConfig.password}`,
      ]

      if (nodeConfig.network === 'ws') {
        result.push('ws=true')
        result.push(`ws-path=${nodeConfig.wsPath}`)

        if (nodeConfig.wsHeaders) {
          result.push(
            'ws-headers=' +
              JSON.stringify(getSurgeExtendHeaders(nodeConfig.wsHeaders)),
          )
        }
      }

      return [
        nodeConfig.nodeName,
        [nodeConfig.nodeName, result.join(', ')].join(' = '),
      ]
    }

    case NodeTypeEnum.Socks5: {
      const result = [
        nodeConfig.tls === true ? 'socks5-tls' : 'socks5',
        nodeConfig.hostname,
        nodeConfig.port,
        ...pickAndFormatStringList(
          nodeConfig,
          ['username', 'password', 'udpRelay'],
          {
            keyFormat: 'kebabCase',
          },
        ),
      ]

      if (nodeConfig.tls === true) {
        result.push(
          ...(typeof nodeConfig.clientCert === 'string'
            ? [`client-cert=${nodeConfig.clientCert}`]
            : []),
        )
      }

      return [
        nodeConfig.nodeName,
        [nodeConfig.nodeName, result.join(', ')].join(' = '),
      ]
    }

    case NodeTypeEnum.Tuic: {
      if ('version' in nodeConfig && Number(nodeConfig.version) === 5) {
        const result = [
          'tuic-v5',
          nodeConfig.hostname,
          nodeConfig.port,
          ...pickAndFormatStringList(nodeConfig, ['password', 'uuid'], {
            keyFormat: 'kebabCase',
          }),
        ]

        return [
          nodeConfig.nodeName,
          [nodeConfig.nodeName, result.join(', ')].join(' = '),
        ]
      }

      const result = [
        'tuic',
        nodeConfig.hostname,
        nodeConfig.port,
        ...pickAndFormatStringList(nodeConfig, ['token'], {
          keyFormat: 'kebabCase',
        }),
      ]

      return [
        nodeConfig.nodeName,
        [nodeConfig.nodeName, result.join(', ')].join(' = '),
      ]
    }

    case NodeTypeEnum.Hysteria2:
      /* istanbul ignore next -- @preserve */
      if (nodeConfig.uploadBandwidth) {
        logger.info(
          `Surge 不支持为 Hysteria2 节点配置 uploadBandwidth，节点 ${nodeConfig.nodeName} 将不包含此字段`,
        )
      }
      /* istanbul ignore next -- @preserve */
      if (nodeConfig.obfs) {
        logger.warn(
          `Surge 不支持为 Hysteria2 节点配置 obfs，节点 ${nodeConfig.nodeName} 将被忽略`,
        )
        return undefined
      }

      return [
        nodeConfig.nodeName,
        [
          `${nodeConfig.nodeName} = hysteria2`,
          nodeConfig.hostname,
          nodeConfig.port,
          ...pickAndFormatStringList(
            nodeConfig,
            ['password', 'downloadBandwidth'],
            {
              keyFormat: 'kebabCase',
            },
          ),
        ].join(', '),
      ]

    case NodeTypeEnum.AnyTLS: {
      const result: string[] = [
        'anytls',
        nodeConfig.hostname,
        `${nodeConfig.port}`,
        `password=${nodeConfig.password}`,
        ...pickAndFormatStringList(nodeConfig, ['reuse'], {
          keyFormat: 'kebabCase',
        }),
      ]

      return [
        nodeConfig.nodeName,
        [nodeConfig.nodeName, result.join(', ')].join(' = '),
      ]
    }

    case NodeTypeEnum.Masque: {
      if (nodeConfig.authMode !== 'basic-auth') {
        logger.warn(
          `Surge 仅支持 basic-auth 模式的 MASQUE 节点，节点 ${nodeConfig.nodeName} 会被省略`,
        )
        return undefined
      }

      const result: string[] = [
        'masque',
        nodeConfig.hostname,
        `${nodeConfig.port}`,
        ...pickAndFormatStringList(nodeConfig, ['username', 'password']),
      ]

      if (nodeConfig.alpn) {
        result.push(`alpn=${JSON.stringify(nodeConfig.alpn.join(','))}`)
      }

      return [
        nodeConfig.nodeName,
        [nodeConfig.nodeName, result.join(', ')].join(' = '),
      ]
    }

    case NodeTypeEnum.TrustTunnel: {
      if (nodeConfig.quic) {
        logger.warn(
          `Surge 不支持 QUIC 模式的 TrustTunnel 节点，节点 ${nodeConfig.nodeName} 会被省略`,
        )
        return undefined
      }

      const result: string[] = [
        'trust-tunnel',
        nodeConfig.hostname,
        `${nodeConfig.port}`,
        ...pickAndFormatStringList(
          nodeConfig,
          ['username', 'password', 'maxStreams'],
          { keyFormat: 'kebabCase' },
        ),
      ]

      if (nodeConfig.alpn) {
        result.push(`alpn=${JSON.stringify(nodeConfig.alpn.join(','))}`)
      }

      if (nodeConfig.headers) {
        result.push(
          `headers=${Object.entries(nodeConfig.headers)
            .map(([key, value]) => `${key}:${value}`)
            .join(';')}`,
        )
      }

      return [
        nodeConfig.nodeName,
        [nodeConfig.nodeName, result.join(', ')].join(' = '),
      ]
    }

    case NodeTypeEnum.Tailscale: {
      assertSurgeTailscaleAuthKey(nodeConfig)

      const policyOptions = [
        `section-name=${nodeConfig.nodeName}`,
        ...pickAndFormatStringList(
          nodeConfig,
          ['underlyingProxy', 'testUrl', 'testTimeout', 'ecn', 'noErrorAlert'],
          { keyFormat: 'kebabCase' },
        ),
      ]

      return [
        nodeConfig.nodeName,
        `${nodeConfig.nodeName} = tailscale, ${policyOptions.join(', ')}`,
      ]
    }

    case NodeTypeEnum.Wireguard:
      return [
        nodeConfig.nodeName,
        [
          `${nodeConfig.nodeName} = wireguard`,
          `section-name = ${nodeConfig.nodeName}`,
        ].join(', '),
      ]

    /* istanbul ignore next -- @preserve */
    default:
      logger.warn(
        `不支持为 Surge 生成 ${(nodeConfig as any).type} 的节点，节点 ${
          (nodeConfig as any).nodeName
        } 会被省略`,
      )
      return undefined
  }
}

function assertSurgeTailscaleAuthKey(
  nodeConfig: Extract<PossibleNodeConfigType, { type: NodeTypeEnum.Tailscale }>,
): asserts nodeConfig is typeof nodeConfig & { authKey: string } {
  if (!nodeConfig.authKey) {
    throw new Error(
      `无法为 Surge 生成 Tailscale 节点 ${nodeConfig.nodeName}：缺少必填字段 authKey`,
    )
  }
}

function appendCommonConfig(
  original: string,
  nodeConfig: PossibleNodeConfigType,
): string {
  const appendConfig = [
    ...pickAndFormatStringList(
      nodeConfig,
      [
        'tfo',
        'mptcp',
        'ecn',
        'underlyingProxy',
        'testUrl',
        'testTimeout',
        'tls13',
        'skipCertVerify',
        'sni',
        'serverCertFingerprintSha256',
        'blockQuic',
        'portHopping',
        'portHoppingInterval',
      ],
      {
        keyFormat: 'kebabCase',
      },
    ),
    ...parseShadowTlsConfig(nodeConfig),
  ]

  if (nodeConfig.type === NodeTypeEnum.Tuic) {
    appendConfig.push(
      ...('alpn' in nodeConfig && Array.isArray(nodeConfig.alpn)
        ? (() => {
            const alpn = nodeConfig.alpn as string[]
            const preferred = ['h3', 'h2', 'http/1.1'].find((a) =>
              alpn.includes(a),
            )
            return [`alpn=${preferred ?? alpn[0]}`]
          })()
        : []),
    )
  }

  if (!appendConfig.length) {
    return original
  }

  return original + ', ' + appendConfig.join(', ')
}

function parseShadowTlsConfig(nodeConfig: PossibleNodeConfigType) {
  const result: string[] = []

  if (nodeConfig.shadowTls) {
    result.push(
      `shadow-tls-password=${nodeConfig.shadowTls.password}`,
      `shadow-tls-sni=${nodeConfig.shadowTls.sni}`,
    )

    if (nodeConfig.shadowTls.version) {
      result.push(`shadow-tls-version=${nodeConfig.shadowTls.version}`)
    }
  }

  return result
}
