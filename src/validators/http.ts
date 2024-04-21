import { z } from 'zod'

import { NodeTypeEnum } from '../types'
import {
  PortValidator,
  SimpleNodeConfigValidator,
  TlsNodeConfigValidator,
} from './common'

export const HttpNodeConfigValidator = SimpleNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.HTTP),
  hostname: z.string(),
  port: PortValidator,
  username: z.string(),
  password: z.string(),
  path: z.string().optional(),
  headers: z.record(z.string()).optional(),
})

export const HttpsNodeConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.HTTPS),
  username: z.string(),
  password: z.string(),
  path: z.string().optional(),
  headers: z.record(z.string()).optional(),
})
