import { z } from 'zod'

import { NodeTypeEnum } from '../types'

import { SimpleNodeConfigValidator } from './common'

const NonEmptyStringValidator = z.string().min(1)

export const TailscaleNodeConfigValidator = SimpleNodeConfigValidator.extend({
  type: z
    .literal(NodeTypeEnum.Tailscale)
    .describe('节点类型，固定为 tailscale'),
  authKey: NonEmptyStringValidator.optional().describe(
    'Tailscale 鉴权密钥（Auth Key），用于自动登录并将设备加入 tailnet',
  ),
  hostname: NonEmptyStringValidator.optional().describe(
    '节点在 tailnet 中显示的主机名，默认使用系统主机名',
  ),
  controlUrl: z
    .string()
    .url()
    .optional()
    .describe(
      '自定义控制服务器（coordination server）地址，默认为 https://controlplane.tailscale.com，可指向 Headscale 等自建服务',
    ),
  exitNode: NonEmptyStringValidator.optional().describe(
    '用作出口节点（exit node）的节点名称或 IP 地址',
  ),
  ephemeral: z
    .boolean()
    .optional()
    .describe(
      '是否以临时节点（ephemeral node）身份注册，离线后会自动从 tailnet 移除',
    ),
  stateDir: NonEmptyStringValidator.optional().describe(
    '存放 Tailscale 状态数据的目录，默认为 tailscale',
  ),
  udpRelay: z.boolean().optional().describe('是否启用 UDP 转发，默认开启'),
  acceptRoutes: z
    .boolean()
    .optional()
    .describe('是否接受其它节点通告的子网路由（subnet routes）'),
  exitNodeAllowLanAccess: z
    .boolean()
    .optional()
    .describe('使用出口节点时，是否允许直接访问本地局域网而不经由出口节点'),
  routingMark: z
    .number()
    .int()
    .min(0)
    .max(0xffff_ffff)
    .optional()
    .describe('为 Tailscale 流量设置的路由标记（fwmark），仅在 Linux 下有效'),
  derpOnly: z
    .boolean()
    .optional()
    .describe('是否强制仅通过 DERP 中继服务器连接，禁用点对点直连'),
  idleKeepalive: z
    .number()
    .int()
    .optional()
    .describe('空闲连接的保活间隔，单位为秒'),
  preferIpv6: z.boolean().optional().describe('是否优先使用 IPv6'),
  dnsServers: z
    .array(NonEmptyStringValidator)
    .nonempty()
    .optional()
    .describe('自定义 DNS 服务器列表'),
  mtu: z
    .number()
    .int()
    .min(576)
    .max(1420)
    .optional()
    .describe('网络接口的 MTU（最大传输单元），取值范围 576-1420'),
  noErrorAlert: z
    .boolean()
    .optional()
    .describe('是否在连接出错时不弹出提示（Surge 专用）'),
  ipVersion: z
    .enum(['dual', 'ipv4', 'ipv6', 'ipv4-prefer', 'ipv6-prefer'])
    .optional()
    .describe('IP 版本偏好'),
})
