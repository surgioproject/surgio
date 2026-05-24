import { z } from 'zod'

import { NodeTypeEnum } from '../types'

import {
  MultiplexValidator,
  PortValidator,
  TlsNodeConfigValidator,
} from './common'
import {
  VmessH2OptsValidator,
  VmessGRPCOptsValidator,
  VmessHttpOptsValidator,
  VmessWSOptsValidator,
  VmessQuicOptsValidator,
  VmessHttpUpgradeOptsValidator,
} from './vmess'

export const VlessNetworkValidator = z.union([
  z.literal('tcp'),
  z.literal('ws'),
  z.literal('h2'),
  z.literal('http'),
  z.literal('grpc'),
  z.literal('xhttp'),
  z.literal('quic'),
  z.literal('httpupgrade'),
])

export const VlessRealityOptsValidator = z.object({
  publicKey: z.string(),
  shortId: z.ostring(),
  spiderX: z.ostring(),
})

export const VlessXHTTPOptsValidator = z
  .object({
    path: z.string(),
  })
  .passthrough()

export const VlessECHPortsValidator = z.record(z.any())

export const VlessNodeConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Vless),
  hostname: z.string(),
  port: PortValidator,
  method: z.literal('none'),
  uuid: z.string().uuid(),
  network: VlessNetworkValidator.default('tcp'),
  udpRelay: z.oboolean(),
  flow: z.ostring(),
  encryption: z.ostring(),

  wsOpts: VmessWSOptsValidator.optional(),
  h2Opts: VmessH2OptsValidator.optional(),
  httpOpts: VmessHttpOptsValidator.optional(),
  grpcOpts: VmessGRPCOptsValidator.optional(),
  xhttpOpts: VlessXHTTPOptsValidator.optional(),
  echOpts: VlessECHPortsValidator.optional(),
  packetEncoding: z.ostring(),
  quicOpts: VmessQuicOptsValidator.optional(),
  httpUpgradeOpts: VmessHttpUpgradeOptsValidator.optional(),
  realityOpts: VlessRealityOptsValidator.optional(),
  multiplex: MultiplexValidator.optional(),
})
