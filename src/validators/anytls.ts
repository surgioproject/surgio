import { z } from 'zod'

import { NodeTypeEnum } from '../types'

import { TlsNodeConfigValidator } from './common'

const AnyTLSRealityOptsValidator = z.object({
  publicKey: z.string(),
  shortId: z.ostring(),
})

export const AnyTLSNodeConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.AnyTLS),
  password: z.string(),
  udpRelay: z.oboolean(),
  realityOpts: AnyTLSRealityOptsValidator.optional(),
  idleSessionCheckInterval: z.number().optional(),
  idleSessionTimeout: z.number().optional(),
  minIdleSessions: z.number().optional(),
})
