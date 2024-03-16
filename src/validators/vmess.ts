import { z } from 'zod'

import { NodeTypeEnum } from '../types'
import {
  PortValidator,
  SimpleNodeConfigValidator,
  AlterIdValiator,
} from './common'

export const VmessNetworkValidator = z.union([
  z.literal('tcp'),
  z.literal('ws'),
  z.literal('h2'),
  z.literal('http'),
  z.literal('grpc'),
])

export const VmessMethodValidator = z.union([
  z.literal('none'),
  z.literal('aes-128-gcm'),
  z.literal('chacha20-poly1305'),
  z.literal('auto'),
])

export const VmessWSOptsValidator = z.object({
  path: z.string(),
  headers: z.record(z.string()).optional(),
})

export const VmessH2OptsValidator = z.object({
  path: z.string(),
  host: z.array(z.string()).nonempty(),
})

export const VmessHttpOptsValidator = z.object({
  path: z.array(z.string()),
  headers: z.record(z.string()).optional(),
  method: z.ostring().default('GET'),
})

export const VmessGRPCOptsValidator = z.object({
  serviceName: z.string(),
})

/**
 * @see https://stash.wiki/proxy-protocols/proxy-types#vmess
 * @see https://wiki.metacubex.one/config/proxies/vmess/
 */
export const VmessNodeConfigValidator = SimpleNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Vmess),
  hostname: z.string(),
  port: PortValidator,
  method: VmessMethodValidator,
  uuid: z.string().uuid(),
  alterId: AlterIdValiator.optional(),
  network: VmessNetworkValidator.default('tcp'),
  udpRelay: z.oboolean(),

  wsOpts: VmessWSOptsValidator.optional(),
  h2Opts: VmessH2OptsValidator.optional(),
  httpOpts: VmessHttpOptsValidator.optional(),
  grpcOpts: VmessGRPCOptsValidator.optional(),

  tls: z.oboolean(),
  sni: z.ostring(),
  tls13: z.oboolean(),
  skipCertVerify: z.oboolean(),
  serverCertFingerprintSha256: z.ostring(),
  alpn: z.array(z.string()).nonempty().optional(),

  /**
   * @deprecated
   */
  host: z.ostring(),
  /**
   * @deprecated
   */
  path: z.ostring(),
  /**
   * @deprecated
   */
  wsHeaders: z.record(z.string()).optional(),
})
