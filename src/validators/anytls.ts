import { z } from 'zod'

import { NodeTypeEnum } from '../types'

import { TlsNodeConfigValidator } from './common'

export const AnyTLSNodeConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.AnyTLS),
  password: z.string(),
  udpRelay: z.oboolean(),
  idleSessionCheckInterval: z.number().optional(),
  idleSessionTimeout: z.number().optional(),
  minIdleSessions: z.number().optional(),
})
