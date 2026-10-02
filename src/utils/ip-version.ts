import type { Logger } from '@surgio/logger'

export type IpVersion =
  'dual' | 'v4-only' | 'v6-only' | 'prefer-v4' | 'prefer-v6'

// Surgio 的 ipVersion 同时接受 Surge、Mihomo 和 Egern 的取值，统一归一化为 Surge 取值
const IP_VERSION_ALIASES = new Map<string, IpVersion>([
  ['dual', 'dual'],
  ['dual_stack', 'dual'],
  ['v4-only', 'v4-only'],
  ['ipv4', 'v4-only'],
  ['v4_only', 'v4-only'],
  ['v6-only', 'v6-only'],
  ['ipv6', 'v6-only'],
  ['v6_only', 'v6-only'],
  ['prefer-v4', 'prefer-v4'],
  ['ipv4-prefer', 'prefer-v4'],
  ['v4_prefer', 'prefer-v4'],
  ['prefer-v6', 'prefer-v6'],
  ['ipv6-prefer', 'prefer-v6'],
  ['v6_prefer', 'prefer-v6'],
])

export function resolveIpVersion(
  nodeConfig: { nodeName: string; ipVersion?: string },
  clientName: string,
  logger: Logger,
): IpVersion | undefined {
  if (!nodeConfig.ipVersion) {
    return undefined
  }
  const ipVersion = IP_VERSION_ALIASES.get(nodeConfig.ipVersion)
  if (!ipVersion) {
    logger.warn(
      `${clientName} 不支持 ipVersion=${nodeConfig.ipVersion}，节点 ${nodeConfig.nodeName} 将不包含此字段`,
    )
  }
  return ipVersion
}
