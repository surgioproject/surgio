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
  obfsUri: z.ostring(),
  udpRelay: z.oboolean(),
  reuse: z.oboolean(),
  version: IntegersVersionValidator.optional(),
  // 仅 sing-box 使用：snell 多用户服务端的用户 key
  userkey: z.ostring(),
  // 仅 sing-box 使用：snell v6 的流量整形模式
  mode: z.enum(['default', 'unshaped', 'unsafe-raw']).optional(),
})
