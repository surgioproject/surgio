import { z } from 'zod/v3'

import { NodeTypeEnum } from '../types'

import { TlsNodeConfigValidator } from './common'

export const TrustTunnelNodeConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.TrustTunnel),
  username: z.string(),
  password: z.string(),
  quic: z.oboolean(),
  udpRelay: z.oboolean(),
  headers: z.record(z.string()).optional(),
  healthCheck: z.oboolean(),
  nameCertVerify: z.ostring(),
  congestionController: z.string().min(1).optional(),
  bbrProfile: z.enum(['standard', 'conservative', 'aggressive']).optional(),
  maxConnections: z.number().int().nonnegative().optional(),
  minStreams: z.number().int().nonnegative().optional(),
  maxStreams: z.number().int().nonnegative().optional(),
}).superRefine((node, ctx) => {
  const requiredAlpn = node.quic ? 'h3' : 'h2'

  if (node.alpn && !node.alpn.includes(requiredAlpn)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `TrustTunnel ${
        node.quic ? 'QUIC' : 'HTTP/2'
      } 模式的 alpn 必须包含 ${requiredAlpn}`,
      path: ['alpn'],
    })
  }

  if (
    !node.quic &&
    (node.portHopping || node.portHoppingInterval !== undefined)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'TrustTunnel 仅在 QUIC 模式下支持端口跳跃',
      path: ['portHopping'],
    })
  }

  if (
    !node.quic &&
    (node.congestionController !== undefined || node.bbrProfile !== undefined)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'TrustTunnel 仅在 QUIC 模式下支持拥塞控制参数',
      path: ['congestionController'],
    })
  }

  if (node.quic && node.shadowTls) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'TrustTunnel QUIC 模式不支持 Shadow TLS',
      path: ['shadowTls'],
    })
  }

  if (
    node.maxStreams !== undefined &&
    (node.maxConnections !== undefined || node.minStreams !== undefined)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'TrustTunnel 的 maxStreams 不能与 maxConnections 或 minStreams 同时配置',
      path: ['maxStreams'],
    })
  }
})
