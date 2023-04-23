import { z } from 'zod'

import { NodeTypeEnum } from '../types'
import { PortValidator, SimpleNodeConfigValidator } from './common'

export const VmessNodeConfigValidator = SimpleNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Vmess),
  hostname: z.string(),
  port: PortValidator,
  method: z.union([
    z.literal('none'),
    z.literal('aes-128-gcm'),
    z.literal('chacha20-ietf-poly1305'),
    z.literal('auto'),
  ]),
  uuid: z.string().uuid(),
  alterId: z.string(),
  network: z.union([z.literal('tcp'), z.literal('ws')]),
  tls: z.boolean(),
  host: z.ostring(),
  path: z.ostring(),
  udpRelay: z.oboolean(),
  tls13: z.oboolean(),
  skipCertVerify: z.oboolean(),
  wsHeaders: z.record(z.string()).optional(),
  serverCertFingerprintSha256: z.ostring(),
})
