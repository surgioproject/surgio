import { z } from 'zod';

import { NodeTypeEnum } from '../types';
import { SimpleNodeConfigValidator } from './common';

const WireguardPeerConfigValidator = z.object({
  publicKey: z.string(),
  endpoint: z.string().includes(':'),
  allowedIps: z.string().optional(),
  keepAlive: z.number().optional(),
  presharedKey: z.string().optional(),
});

export const WireguardNodeConfigValidator = SimpleNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Wireguard),
  selfIp: z.string().ip({ version: 'v4' }),
  selfIpV6: z.string().ip({ version: 'v6' }).optional(),
  preferIpv6: z.boolean().optional(),
  privateKey: z.string(),
  mtu: z.number().optional(),
  dnsServer: z.array(z.string().ip()).optional(),
  peers: z.array(WireguardPeerConfigValidator),
});
