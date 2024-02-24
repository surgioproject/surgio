import { z } from 'zod'

import { NodeTypeEnum } from '../types'
import {
  PortValidator,
  SimpleNodeConfigValidator,
  AlterIdValiator,
} from './common'

export const VmessNetworkValidator = z.union([
  z.literal('tcp'),
  z.literal('ws'),
  // z.literal('h2'),
  // z.literal('http'),
  // z.literal('grpc'),
])

export const VmessMethodValidator = z.union([
  z.literal('none'),
  z.literal('aes-128-gcm'),
  z.literal('chacha20-ietf-poly1305'),
  z.literal('auto'),
])

// https://stash.wiki/proxy-protocols/proxy-types#vmess
export const VmessNodeConfigValidator = SimpleNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Vmess),
  hostname: z.string(),
  port: PortValidator,
  method: VmessMethodValidator,
  uuid: z.string().uuid(),
  alterId: AlterIdValiator,
  network: VmessNetworkValidator,
  tls: z.boolean(),
  host: z.ostring(),
  path: z.ostring(),
  udpRelay: z.oboolean(),
  tls13: z.oboolean(),
  skipCertVerify: z.oboolean(),
  wsHeaders: z.record(z.string()).optional(),
  serverCertFingerprintSha256: z.ostring(),
})
