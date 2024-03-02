import { createLogger } from '@surgio/logger'

import { OBFS_UA, SURFBOARD_SUPPORTED_VMESS_NETWORK } from '../constant'
import {
  NodeFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  SortedNodeFilterType,
} from '../types'
import { pickAndFormatStringList } from './index'
import { applyFilter } from '../filters'

const logger = createLogger({ service: 'surgio:utils:surfboard' })

export const getSurfboardExtendHeaders = (
  wsHeaders: Record<string, string>,
): string => {
  return Object.keys(wsHeaders)
    .map((headerKey) => `${headerKey}:${wsHeaders[headerKey]}`)
    .join('|')
}

/**
 * @see https://getsurfboard.com/docs/profile-format/proxy/
 */
export const getSurfboardNodes = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
): string {
  const result: string[] = applyFilter(list, filter)
    .map(nodeListMapper)
    .filter((item): item is [string, string] => item !== undefined)
    .map((item) => item[1])

  return result.join('\n')
}

export const getSurfboardNodeNames = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
): string {
  return applyFilter(list, filter)
    .map(nodeListMapper)
    .filter((item): item is [string, string] => item !== undefined)
    .map((item) => item[0])
    .join(', ')
}

function nodeListMapper(
  nodeConfig: PossibleNodeConfigType,
): [string, string] | undefined {
  switch (nodeConfig.type) {
    case NodeTypeEnum.Shadowsocks: {
      if (nodeConfig.obfs && ['ws', 'wss'].includes(nodeConfig.obfs)) {
        logger.warn(
          `不支持为 Surfboard 生成 v2ray-plugin 的 Shadowsocks 节点，节点 ${nodeConfig.nodeName} 会被省略`,
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
            nodeConfig.username,
            nodeConfig.password,
            ...(typeof nodeConfig.skipCertVerify === 'boolean'
              ? [`skip-cert-verify=${nodeConfig.skipCertVerify}`]
              : []),
            ...pickAndFormatStringList(nodeConfig, ['sni']),
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
            nodeConfig.username,
            nodeConfig.password,
          ].join(', '),
        ].join(' = '),
      ]
    }

    case NodeTypeEnum.Vmess: {
      if (
        !SURFBOARD_SUPPORTED_VMESS_NETWORK.includes(nodeConfig.network as any)
      ) {
        logger.warn(
          `Surfboard 不支持 ${nodeConfig.network} 的 Vmess 节点，节点 ${nodeConfig.nodeName} 会被省略`,
        )
        return void 0
      }

      const result = [
        'vmess',
        nodeConfig.hostname,
        nodeConfig.port,
        `username=${nodeConfig.uuid}`,
      ]

      if (
        ['chacha20-ietf-poly1305', 'aes-128-gcm'].includes(nodeConfig.method)
      ) {
        result.push(`encrypt-method=${nodeConfig.method}`)
      }

      if (nodeConfig.network === 'ws') {
        result.push('ws=true')

        if (nodeConfig.wsOpts) {
          result.push(`ws-path=${nodeConfig.wsOpts.path}`)
        }

        result.push(
          'ws-headers=' +
            JSON.stringify(
              getSurfboardExtendHeaders({
                'user-agent': OBFS_UA,
                ...nodeConfig.wsOpts?.headers,
              }),
            ),
        )
      }

      if (nodeConfig.tls) {
        result.push('tls=true')

        if (nodeConfig.skipCertVerify) {
          result.push('skip-cert-verify=true')
        }

        if (nodeConfig.sni) {
          result.push(`sni=${nodeConfig.sni}`)
        }
      }

      if (nodeConfig?.surfboardConfig?.vmessAEAD) {
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
        ...pickAndFormatStringList(nodeConfig, ['sni']),
        ...(typeof nodeConfig.skipCertVerify === 'boolean'
          ? [`skip-cert-verify=${nodeConfig.skipCertVerify}`]
          : []),
      ]

      if (nodeConfig.network === 'ws') {
        result.push('ws=true')
        result.push(`ws-path=${nodeConfig.wsPath}`)

        if (nodeConfig.wsHeaders) {
          result.push(
            'ws-headers=' +
              JSON.stringify(getSurfboardExtendHeaders(nodeConfig.wsHeaders)),
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
        ...pickAndFormatStringList(nodeConfig, ['username', 'password', 'sni']),
      ]

      if (nodeConfig.tls === true) {
        result.push(
          ...(typeof nodeConfig.skipCertVerify === 'boolean'
            ? [`skip-cert-verify=${nodeConfig.skipCertVerify}`]
            : []),
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

    // istanbul ignore next
    default:
      logger.warn(
        `不支持为 Surfboard 生成 ${nodeConfig.type} 的节点，节点 ${nodeConfig.nodeName} 会被省略`,
      )
      return void 0
  }
}
