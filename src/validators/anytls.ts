import { z } from 'zod/v3'

import { NodeTypeEnum } from '../types.js'

import { TlsNodeConfigValidator } from './common.js'

const AnyTLSRealityOptsValidator = z.object({
  publicKey: z.string(),
  shortId: z.ostring(),
})

export const AnyTLSNodeConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.AnyTLS),
  password: z.string(),
  udpRelay: z.oboolean(),
  realityOpts: AnyTLSRealityOptsValidator.optional(),
  idleSessionCheckInterval: z.number().nonnegative().optional(),
  idleSessionTimeout: z.number().nonnegative().optional(),
  minIdleSessions: z.number().int().nonnegative().optional(),
  reuse: z.oboolean(),
})
