import { z } from 'zod'

import { NodeTypeEnum } from '../types'

import {
  IntegersVersionValidator,
  PortValidator,
  SimpleNodeConfigValidator,
} from './common'

export const SnellNodeConfigValidator = SimpleNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Snell),
  hostname: z.string(),
  port: PortValidator,
  psk: z.string(),
  obfs: z.union([z.literal('http'), z.literal('tls')]).optional(),
  obfsHost: z.ostring(),
  reuse: z.oboolean(),
  version: IntegersVersionValidator.optional(),
  // snell v6 多用户模式下用户的 key（仅 sing-box 使用）
  userkey: z.ostring(),
  // snell v6 的流量整形模式（仅 sing-box 使用）
  mode: z.enum(['default', 'unshaped', 'unsafe-raw']).optional(),
})
