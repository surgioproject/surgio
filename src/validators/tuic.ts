import { z } from 'zod'

import { NodeTypeEnum } from '../types'
import { IntegersVersionValidator, TlsNodeConfigValidator } from './common'

export const TuicNodeV5ConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Tuic),
  password: z.string(),
  uuid: z.string(),
  version: IntegersVersionValidator,
})

export const TuicNodeV4ConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Tuic),
  token: z.string(),
})

export const TuicNodeConfigValidator = z.union([
  TuicNodeV4ConfigValidator,
  TuicNodeV5ConfigValidator,
])
