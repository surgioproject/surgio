import { z } from 'zod'

import { NodeTypeEnum } from '../types'
import { TlsNodeConfigValidator } from './common'

export const TuicNodeConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Tuic),
  token: z.string(),
  udpRelay: z.oboolean(),
})
