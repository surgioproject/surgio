import YAML from 'yaml'
import { logger as defaultLogger } from '@surgio/logger'

import { applyFilter } from '../filters/index.js'
import { NodeTypeEnum } from '../types.js'
import { getClashNodes } from '../utils/clash.js'
import { getLoonNodes } from '../utils/loon.js'
import { getShadowsocksNodes, getShadowsocksrNodes } from '../utils/portable.js'
import { getQuantumultXNodes } from '../utils/quantumult.js'
import { getSingboxEndpoints, getSingboxNodes } from '../utils/singbox.js'
import { getSurfboardNodes } from '../utils/surfboard.js'
import { getSurgeNodes } from '../utils/surge.js'
import { getV2rayNNodes } from '../utils/v2rayn.js'

import type {
  NodeFilterType,
  PossibleNodeConfigType,
  SortedNodeFilterType,
} from '../types.js'
import type { ProviderFormat } from './public.js'
import type { FormatterOptions } from './types.js'

type SectionNodeHint = {
  /** 配置段名称。 */
  sectionName: string
  /** 生成该配置段的模板方法。 */
  formatter: string
}

/**
 * Provider 输出的是纯节点列表，装不下独立配置段。留下 section-name 引用会让
 * 客户端加载失败，所以这些节点类型在 Provider 输出中省略，并提示改用能同时
 * 生成配置段的 Artifact 模板方法。
 */
const SECTION_NODES: Partial<
  Record<
    ProviderFormat,
    { client: string; hints: Partial<Record<NodeTypeEnum, SectionNodeHint>> }
  >
> = {
  surge: {
    client: 'Surge',
    hints: {
      [NodeTypeEnum.Wireguard]: {
        sectionName: 'WireGuard',
        formatter: 'getSurgeWireguardNodes',
      },
      [NodeTypeEnum.Tailscale]: {
        sectionName: 'Tailscale',
        formatter: 'getSurgeTailscaleNodes',
      },
    },
  },
  surfboard: {
    client: 'Surfboard',
    hints: {
      [NodeTypeEnum.Wireguard]: {
        sectionName: 'WireGuard',
        formatter: 'getSurfboardWireguardNodes',
      },
    },
  },
}

export const formatProviderNodes = (
  format: ProviderFormat,
  nodeList: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  options: FormatterOptions = {},
): string => {
  const callFormatter = <T>(
    formatter: (...args: any[]) => T,
    formatterOptions?: FormatterOptions,
  ): T => {
    if (formatterOptions) return formatter(nodeList, filter, formatterOptions)
    return filter === undefined
      ? formatter(nodeList)
      : formatter(nodeList, filter)
  }
  const withoutSectionNodes = (): ReadonlyArray<PossibleNodeConfigType> => {
    const filtered = applyFilter(nodeList, filter)
    const entry = SECTION_NODES[format]

    if (!entry) return filtered

    const logger = options.logger ?? defaultLogger

    return filtered.filter((node) => {
      const hint = entry.hints[node.type]

      if (!hint) return true

      logger.warn(
        `${entry.client} Provider 纯节点列表无法包含 ${hint.sectionName} 配置段，节点 ${node.nodeName} 会被省略；请使用完整 Artifact 模板和 ${hint.formatter}`,
      )

      return false
    })
  }

  switch (format) {
    case 'clash':
    case 'clash-provider':
      return YAML.stringify({ proxies: callFormatter(getClashNodes, options) })
    case 'singbox':
      return JSON.stringify(
        {
          outbounds: callFormatter(getSingboxNodes, options),
          endpoints: callFormatter(getSingboxEndpoints),
        },
        null,
        2,
      )
    case 'surge':
      return getSurgeNodes(withoutSectionNodes(), undefined, options)
    case 'surfboard':
      return getSurfboardNodes(withoutSectionNodes(), undefined, options)
    case 'quantumultx':
      return callFormatter(getQuantumultXNodes, options)
    case 'loon':
      return callFormatter(getLoonNodes, options)
    case 'shadowsocks':
      return callFormatter(getShadowsocksNodes)
    case 'shadowsocksr':
      return callFormatter(getShadowsocksrNodes)
    case 'v2rayn':
      return callFormatter(getV2rayNNodes, options)
    default:
      throw new Error(`Unsupported provider format: ${format}`)
  }
}
