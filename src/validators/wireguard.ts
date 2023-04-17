import { z } from 'zod';

import { NodeTypeEnum } from '../types';
import { SimpleNodeConfigValidator } from './common';

export const WireguardNodeConfigValidator = SimpleNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Wireguard),
  endpoint: z.string(),
  selfIp: z.string().ip({ version: 'v4' }),
  selfIpV6: z.string().ip({ version: 'v6' }).optional(),
  preferIpv6: z.boolean().optional(),
  privateKey: z.string(),
  publicKey: z.string(),
  mtu: z.number().optional(),
  dnsServer: z.array(z.string().ip()).optional(),
  presharedKey: z.string().optional(),
  allowedIps: z.string().optional(),
  keepAlive: z.number().optional(),
});
