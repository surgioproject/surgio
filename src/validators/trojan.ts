import { z } from 'zod'

import { NodeTypeEnum } from '../types'
import { TlsNodeConfigValidator } from './common'

export const TrojanNodeConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Trojan),
  password: z.string(),
  udpRelay: z.oboolean(),
  network: z.union([z.literal('tcp'), z.literal('ws')]).optional(),
  wsPath: z.ostring(),
  wsHeaders: z.record(z.string()).optional(),
})
