import { z } from 'zod'

import { NodeTypeEnum } from '../types'

import { SimpleNodeConfigValidator } from './common'

const NonEmptyStringValidator = z.string().min(1)

export const TailscaleNodeConfigValidator = SimpleNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Tailscale),
  nodeName: NonEmptyStringValidator,
  authKey: NonEmptyStringValidator.optional(),
  hostname: NonEmptyStringValidator.optional(),
  controlUrl: z.string().url().optional(),
  exitNode: NonEmptyStringValidator.optional(),
  ephemeral: z.boolean().optional(),
  stateDir: NonEmptyStringValidator.optional(),
  udpRelay: z.boolean().optional(),
  acceptRoutes: z.boolean().optional(),
  exitNodeAllowLanAccess: z.boolean().optional(),
  routingMark: z.number().int().min(0).max(0xffff_ffff).optional(),
  derpOnly: z.boolean().optional(),
  idleKeepalive: z.number().int().optional(),
  preferIpv6: z.boolean().optional(),
  dnsServers: z.array(NonEmptyStringValidator).nonempty().optional(),
  mtu: z.number().int().min(576).max(1420).optional(),
  noErrorAlert: z.boolean().optional(),
  underlyingProxy: NonEmptyStringValidator.optional(),
  interfaceName: NonEmptyStringValidator.optional(),
  testUrl: NonEmptyStringValidator.optional(),
  ipVersion: z
    .enum(['dual', 'ipv4', 'ipv6', 'ipv4-prefer', 'ipv6-prefer'])
    .optional(),
})
