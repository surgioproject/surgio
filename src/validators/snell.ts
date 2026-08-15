import { z } from 'zod/v3'

import { NodeTypeEnum } from '../types.js'

import {
  IntegersVersionValidator,
  PortValidator,
  SimpleNodeConfigValidator,
} from './common.js'

export const SnellNodeConfigValidator = SimpleNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Snell),
  hostname: z.string(),
  port: PortValidator,
  psk: z.string(),
  obfs: z.union([z.literal('http'), z.literal('tls')]).optional(),
  obfsHost: z.ostring(),
  reuse: z.oboolean(),
  version: IntegersVersionValidator.optional(),
})
