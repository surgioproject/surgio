import { z } from 'zod'

import { NodeTypeEnum } from '../types'

import { PortValidator, SimpleNodeConfigValidator } from './common'

export const ShadowsocksrNodeConfigValidator = SimpleNodeConfigValidator.extend(
  {
    type: z.literal(NodeTypeEnum.Shadowsocksr),
    hostname: z.string(),
    port: PortValidator,
    method: z.string(),
    password: z.string(),
    obfs: z.string(),
    obfsparam: z.string(),
    protocol: z.string(),
    protoparam: z.string(),
    udpRelay: z.oboolean(),
  },
)
