import { z } from 'zod'

import { NodeTypeEnum } from '../types'

import { TlsNodeConfigValidator } from './common'

export const Hysteria2NodeConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Hysteria2),
  port: z.union([
    z.number().int().min(0).max(65535),
    z.string().regex(/^\d+(-\d+)?$/),
  ]),
  password: z.string(),
  downloadBandwidth: z.number().optional(),
  uploadBandwidth: z.number().optional(),
  obfs: z.literal('salamander').optional(),
  obfsPassword: z.string().optional(),
})