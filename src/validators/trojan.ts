import { z } from 'zod/v3'

import { NodeTypeEnum } from '../types.js'

import { MultiplexValidator, TlsNodeConfigValidator } from './common.js'

export const TrojanNodeConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Trojan),
  password: z.string(),
  udpRelay: z.oboolean(),
  network: z.union([z.literal('tcp'), z.literal('ws')]).optional(),
  wsPath: z.ostring(),
  wsHeaders: z.record(z.string()).optional(),
  multiplex: MultiplexValidator.optional(),
})
