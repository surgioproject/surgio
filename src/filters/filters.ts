import { FLAGS, TAIWAN } from '../misc/flag_cn'
import { NodeFilterType, NodeTypeEnum } from '../types'

import { reverseFilter, mergeFilters } from './utils'

export const netflixFilter: NodeFilterType = (item) => {
  return ['netflix', 'nf', 'hkbn', 'hkt', 'hgc', 'nbu'].some((key) =>
    item.nodeName.toLowerCase().includes(key),
  )
}

export const usFilter: NodeFilterType = (item) => {
  return ['🇺🇸', ...FLAGS['🇺🇸']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  )
}

export const hkFilter: NodeFilterType = (item) => {
  return ['🇭🇰', ...FLAGS['🇭🇰']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  )
}

export const japanFilter: NodeFilterType = (item) => {
  return ['🇯🇵', ...FLAGS['🇯🇵']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  )
}

export const koreaFilter: NodeFilterType = (item) => {
  return ['🇰🇷', ...FLAGS['🇰🇷']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  )
}

export const singaporeFilter: NodeFilterType = (item) => {
  return ['🇸🇬', ...FLAGS['🇸🇬']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  )
}

export const germanyFilter: NodeFilterType = (item) => {
  return ['🇩🇪', ...FLAGS['🇩🇪']].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  )
}

export const taiwanFilter: NodeFilterType = (item) => {
  return ['🇹🇼', ...TAIWAN].some((key) =>
    item.nodeName.toUpperCase().includes(key),
  )
}

export const chinaBackFilter: NodeFilterType = (item) => {
  return [
    '回国',
    'Back',
    '中国上海',
    '中国北京',
    '中国徐州',
    '中国广州',
    '中国东莞',
    '中国中山',
    '中国深圳',
    '中国枣庄',
    '中国郑州',
    '硅谷上海',
    '东京上海',
    'GCX',
  ].some((key) => item.nodeName.includes(key))
}

export const chinaOutFilter: NodeFilterType = reverseFilter(chinaBackFilter)

export const youtubePremiumFilter: NodeFilterType = mergeFilters([
  usFilter,
  japanFilter,
  koreaFilter,
  hkFilter,
  singaporeFilter,
  taiwanFilter,
  germanyFilter,
])

// istanbul ignore next
export const shadowsocksFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Shadowsocks
// istanbul ignore next
export const shadowsocksrFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Shadowsocksr
// istanbul ignore next
export const vmessFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Vmess
// istanbul ignore next
export const v2rayFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Vmess
// istanbul ignore next
export const snellFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Snell
// istanbul ignore next
export const tuicFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Tuic
// istanbul ignore next
export const httpFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.HTTP
// istanbul ignore next
export const httpsFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.HTTPS
// istanbul ignore next
export const trojanFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Trojan
// istanbul ignore next
export const socks5Filter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Socks5
// istanbul ignore next
export const wireguardFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Wireguard
// istanbul ignore next
export const hysteria2Filter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Hysteria2
// istanbul ignore next
export const vlessFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Vless
// istanbul ignore next
export const anytlsFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.AnyTLS
// istanbul ignore next
export const tailscaleFilter: NodeFilterType = (item) =>
  item.type === NodeTypeEnum.Tailscale
