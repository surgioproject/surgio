import { z } from 'zod/v3'

import { NodeTypeEnum } from '../types'

import { TlsNodeConfigValidator } from './common'

const MasqueTlsNodeConfigValidator = TlsNodeConfigValidator.omit({
  tls13: true,
})

const MasqueBasicAuthNodeConfigValidator = MasqueTlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Masque),
  authMode: z.literal('basic-auth'),
  username: z.string().optional(),
  password: z.string().optional(),
})

const MasqueKeyPairNodeConfigValidator = MasqueTlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Masque),
  authMode: z.literal('key-pair'),
  privateKey: z.string().min(1),
  publicKey: z.string().min(1),
  ip: z.string().min(1).optional(),
  ipv6: z.string().min(1).optional(),
  dnsServers: z.array(z.string().min(1)).nonempty().optional(),
  network: z.enum(['h3', 'h2', 'h3-l4proxy']).optional(),
  sni: z.string().optional(),
  connectUri: z
    .string()
    .url()
    .refine((value) => value.startsWith('https://'), {
      message: 'connectUri 必须为 HTTPS URL',
    })
    .optional(),
  mtu: z.number().int().min(1280).max(1500).optional(),
  keepalive: z.number().int().nonnegative().optional(),
  udpRelay: z.boolean().optional(),
  remoteDnsResolve: z.boolean().optional(),
  congestionController: z.literal('bbr').optional(),
  bbrProfile: z.enum(['standard', 'conservative', 'aggressive']).optional(),
  handshakeTimeout: z.number().int().nonnegative().optional(),
})

export const MasqueNodeConfigValidator = z
  .discriminatedUnion('authMode', [
    MasqueBasicAuthNodeConfigValidator,
    MasqueKeyPairNodeConfigValidator,
  ])
  .superRefine((node, ctx) => {
    if (node.shadowTls) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MASQUE 不支持 Shadow TLS',
        path: ['shadowTls'],
      })
    }

    if (
      node.authMode === 'basic-auth' &&
      node.portHopping &&
      node.underlyingProxy
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MASQUE 的 portHopping 不能与 underlyingProxy 同时使用',
        path: ['underlyingProxy'],
      })
    }

    if (
      node.authMode === 'key-pair' &&
      node.network !== 'h3-l4proxy' &&
      !node.ip &&
      !node.ipv6
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MASQUE key-pair 节点必须配置 ip 或 ipv6',
        path: ['ip'],
      })
    }

    if (
      node.authMode === 'key-pair' &&
      node.network === 'h3-l4proxy' &&
      node.udpRelay === true
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MASQUE h3-l4proxy 模式不支持 UDP',
        path: ['udpRelay'],
      })
    }
  })
