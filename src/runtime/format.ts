import YAML from 'yaml'

import { getClashNodes } from '../utils/clash.js'
import { getLoonNodes } from '../utils/loon.js'
import {
  getShadowsocksNodes,
  getShadowsocksNodesJSON,
  getShadowsocksrNodes,
  getV2rayNNodes,
} from '../utils/portable.js'
import { getQuantumultXNodes } from '../utils/quantumult.js'
import { getSingboxEndpoints, getSingboxNodes } from '../utils/singbox.js'
import { getSurfboardNodes } from '../utils/surfboard.js'
import { getSurgeNodes } from '../utils/surge.js'

import type {
  NodeFilterType,
  PossibleNodeConfigType,
  SortedNodeFilterType,
} from '../types.js'
import type { ProviderFormat } from './public.js'
import type { FormatterOptions } from './types.js'

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
      return callFormatter(getSurgeNodes, options)
    case 'surfboard':
      return callFormatter(getSurfboardNodes, options)
    case 'quantumultx':
      return callFormatter(getQuantumultXNodes, options)
    case 'loon':
      return callFormatter(getLoonNodes, options)
    case 'shadowsocks':
      return callFormatter(getShadowsocksNodes)
    case 'shadowsocks-json':
      return callFormatter(getShadowsocksNodesJSON)
    case 'shadowsocksr':
      return callFormatter(getShadowsocksrNodes)
    case 'v2rayn':
      return callFormatter(getV2rayNNodes)
  }
}
