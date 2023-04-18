import { z } from 'zod';

import { NodeTypeEnum } from '../types';

export const SimpleNodeConfigValidator = z.object({
  type: z.nativeEnum(NodeTypeEnum),
  nodeName: z.string(),
  enable: z.boolean().optional(),

  // TCP features
  tfo: z.boolean().optional(),
  mptcp: z.boolean().optional(),
  shadowTls: z
    .object({
      version: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
      password: z.string(),
      sni: z.string().optional(),
    })
    .optional(),

  // Misc
  underlyingProxy: z.string().optional(),
  testUrl: z.string().optional(),
});

export const TlsNodeConfigValidator = SimpleNodeConfigValidator.extend({
  hostname: z.string(),
  port: z.union([z.string(), z.number()]),
  tls13: z.oboolean(),
  skipCertVerify: z.oboolean(),
  sni: z.ostring(),
  alpn: z.array(z.string()).optional(),
  serverCertFingerprintSha256: z.ostring(),
});

export const PortValidator = z.union([z.string(), z.number()]).refine((v) => {
  const port = Number(v);
  return port > 0 && port < 65536;
});
