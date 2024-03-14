import { z } from 'zod'

import { NodeTypeEnum } from '../types'
import { PortValidator, TlsNodeConfigValidator } from './common'
import {
  VmessNetworkValidator,
  VmessH2OptsValidator,
  VmessGRPCOptsValidator,
  VmessHttpOptsValidator,
  VmessWSOptsValidator,
} from './vmess'

export const VlessNodeConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Vless),
  hostname: z.string(),
  port: PortValidator,
  method: z.literal('none').optional().default('none'),
  uuid: z.string().uuid(),
  network: VmessNetworkValidator,
  udpRelay: z.oboolean(),
  flow: z.string(),

  wsOpts: VmessWSOptsValidator.optional(),
  h2Opts: VmessH2OptsValidator.optional(),
  httpOpts: VmessHttpOptsValidator.optional(),
  grpcOpts: VmessGRPCOptsValidator.optional(),
})
