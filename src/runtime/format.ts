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

export const formatProviderNodes = (
  format: ProviderFormat,
  nodeList: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
): string => {
  const callFormatter = <T>(formatter: (...args: any[]) => T): T =>
    filter === undefined ? formatter(nodeList) : formatter(nodeList, filter)

  switch (format) {
    case 'clash':
    case 'clash-provider':
      return YAML.stringify({ proxies: callFormatter(getClashNodes) })
    case 'singbox':
      return JSON.stringify(
        {
          outbounds: callFormatter(getSingboxNodes),
          endpoints: callFormatter(getSingboxEndpoints),
        },
        null,
        2,
      )
    case 'surge':
      return callFormatter(getSurgeNodes)
    case 'surfboard':
      return callFormatter(getSurfboardNodes)
    case 'quantumultx':
      return callFormatter(getQuantumultXNodes)
    case 'loon':
      return callFormatter(getLoonNodes)
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
