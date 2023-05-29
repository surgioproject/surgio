import { z } from 'zod'

import { NodeTypeEnum } from '../types'
import { TlsNodeConfigValidator } from './common'

export const TuicNodeV5ConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Tuic),
  password: z.string(),
  uuid: z.string(),
  version: z.custom<number>((value) => {
    if (typeof value === 'number' && value >= 5) {
      return true
    }

    const version = Number(value)

    if (Number.isNaN(version)) {
      return false
    }

    return version >= 5
  }),
})

export const TuicNodeV4ConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Tuic),
  token: z.string(),
})

export const TuicNodeConfigValidator = z.union([
  TuicNodeV4ConfigValidator,
  TuicNodeV5ConfigValidator,
])
