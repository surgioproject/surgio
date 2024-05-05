import { z } from 'zod'

import { NodeTypeEnum } from '../types'

import {
  MultiplexValidator,
  PortValidator,
  SimpleNodeConfigValidator,
} from './common'

export const ShadowsocksNodeConfigValidator = SimpleNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Shadowsocks),
  hostname: z.string(),
  port: PortValidator,
  method: z.string(),
  password: z.string(),
  udpRelay: z.oboolean(),
  obfs: z
    .union([
      z.literal('tls'),
      z.literal('http'),
      z.literal('ws'),
      z.literal('wss'),
      z.literal('quic'),
    ])
    .optional(),
  obfsHost: z.ostring(),
  obfsUri: z.ostring(),
  skipCertVerify: z.oboolean(),
  wsHeaders: z.record(z.string()).optional(),
  tls13: z.oboolean(),
  mux: z.oboolean(),
  multiplex: MultiplexValidator.optional(),
})
