import { z } from 'zod'

import { NodeTypeEnum } from '../types'
import { TlsNodeConfigValidator } from './common'

export const Hysteria2NodeConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Hysteria2),
  password: z.string(),
  downloadBandwidth: z.number().optional(),
  uploadBandwidth: z.number().optional(),
  obfs: z.literal('salamander').optional(),
  obfsPassword: z.string().optional(),
})
