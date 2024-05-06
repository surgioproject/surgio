import { z } from 'zod'

import { NodeTypeEnum } from '../types'

import {
  MultiplexValidator,
  PortValidator,
  TlsNodeConfigValidator,
} from './common'
import {
  VmessNetworkValidator,
  VmessH2OptsValidator,
  VmessGRPCOptsValidator,
  VmessHttpOptsValidator,
  VmessWSOptsValidator,
  VmessQuicOptsValidator,
  VmessHttpUpgradeOptsValidator,
} from './vmess'

export const VlessRealityOptsValidator = z.object({
  publicKey: z.string(),
  shortId: z.ostring(),
  spiderX: z.ostring(),
})

export const VlessNodeConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Vless),
  hostname: z.string(),
  port: PortValidator,
  method: z.literal('none'),
  uuid: z.string().uuid(),
  network: VmessNetworkValidator.default('tcp'),
  udpRelay: z.oboolean(),
  flow: z.ostring(),

  wsOpts: VmessWSOptsValidator.optional(),
  h2Opts: VmessH2OptsValidator.optional(),
  httpOpts: VmessHttpOptsValidator.optional(),
  grpcOpts: VmessGRPCOptsValidator.optional(),
  quicOpts: VmessQuicOptsValidator.optional(),
  httpUpgradeOpts: VmessHttpUpgradeOptsValidator.optional(),
  realityOpts: VlessRealityOptsValidator.optional(),
  multiplex: MultiplexValidator.optional(),
})
