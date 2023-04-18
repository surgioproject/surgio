import { z } from 'zod';

import { ArtifactValidator } from './artifact';

const isRegExp = (val: unknown): val is RegExp => {
  return val instanceof RegExp;
};
const regexValidatior = z.custom<RegExp>((val) => {
  return isRegExp(val);
});

export const RemoteSnippetValidator = z.object({
  name: z.string(),
  url: z.string().url(),
  surgioSnippet: z.oboolean(),
});

export const SurgioConfigValidator = z.object({
  artifacts: z.array(ArtifactValidator),
  remoteSnippets: z.array(RemoteSnippetValidator).optional(),
  urlBase: z.ostring(),
  upload: z
    .object({
      prefix: z.ostring(),
      region: z.ostring(),
      endpoint: z.ostring(),
      bucket: z.string(),
      accessKeyId: z.string(),
      accessKeySecret: z.string(),
    })
    .optional(),
  binPath: z
    .object({
      shadowsocksr: z.string().regex(/^\//),
    })
    .optional(),
  flags: z
    .record(
      z.union([
        z.string(),
        regexValidatior,
        z.array(z.union([z.string(), regexValidatior])),
      ]),
    )
    .optional(),
  surgeConfig: z
    .object({
      resolveHostname: z.oboolean(),
      vmessAEAD: z.oboolean(),
    })
    .optional(),
  surfboardConfig: z
    .object({
      vmessAEAD: z.oboolean(),
    })
    .optional(),
  quantumultXConfig: z
    .object({
      vmessAEAD: z.oboolean(),
    })
    .optional(),
  clashConfig: z
    .object({
      enableTuic: z.oboolean(),
      enableShadowTls: z.oboolean(),
    })
    .optional(),
  gateway: z
    .object({
      accessToken: z.ostring(),
      viewerToken: z.ostring(),
      auth: z.oboolean(),
      cookieMaxAge: z.onumber(),
      useCacheOnError: z.oboolean(),
    })
    .optional(),
  checkHostname: z.oboolean(),
  proxyTestUrl: z.string().url().optional(),
  proxyTestInterval: z.onumber(),
  customFilters: z.record(z.function()).optional(),
  customParams: z.record(z.unknown()).optional(),
  analytics: z.oboolean(),
  cache: z
    .object({
      type: z.union([z.literal('redis'), z.literal('default')]).optional(),
      redisUrl: z
        .string()
        .regex(/rediss?/)
        .optional(),
    })
    .optional(),
});
