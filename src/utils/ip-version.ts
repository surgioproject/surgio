import type { Logger } from '@surgio/logger'

type IpVersionClient = 'Surge' | 'Mihomo' | 'Egern'

// 每一行是同一种 IP 版本策略在各客户端中的写法。Surgio 接受其中任一写法。
const IP_VERSION_SPELLINGS: ReadonlyArray<Record<IpVersionClient, string>> = [
  { Surge: 'dual', Mihomo: 'dual', Egern: 'dual_stack' },
  { Surge: 'v4-only', Mihomo: 'ipv4', Egern: 'v4_only' },
  { Surge: 'v6-only', Mihomo: 'ipv6', Egern: 'v6_only' },
  { Surge: 'prefer-v4', Mihomo: 'ipv4-prefer', Egern: 'v4_prefer' },
  { Surge: 'prefer-v6', Mihomo: 'ipv6-prefer', Egern: 'v6_prefer' },
]

const SPELLINGS_BY_VALUE = new Map(
  IP_VERSION_SPELLINGS.flatMap((spellings) =>
    Object.values(spellings).map((value) => [value, spellings] as const),
  ),
)

export const IP_VERSION_VALUES = [...SPELLINGS_BY_VALUE.keys()] as [
  string,
  ...string[],
]

export function formatIpVersion(
  nodeConfig: { nodeName: string; ipVersion?: string },
  client: IpVersionClient,
  logger: Logger,
): string | undefined {
  if (!nodeConfig.ipVersion) {
    return undefined
  }
  const spellings = SPELLINGS_BY_VALUE.get(nodeConfig.ipVersion)
  if (!spellings) {
    logger.warn(
      `${client} 不支持 ipVersion=${nodeConfig.ipVersion}，节点 ${nodeConfig.nodeName} 将不包含此字段`,
    )
    return undefined
  }
  return spellings[client]
}
