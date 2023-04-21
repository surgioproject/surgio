import { z } from 'zod';

import {
  INTERNET_TEST_URL,
  PROXY_TEST_INTERVAL,
  PROXY_TEST_URL,
} from '../constant';
import { ArtifactValidator } from './artifact';
import {
  NodeFilterTypeValidator,
  SortedNodeFilterTypeValidator,
} from './filter';

const isRegExp = (val: unknown): val is RegExp => {
  return val instanceof RegExp;
};
const RegexValidatior = z.custom<RegExp>((val) => {
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
  urlBase: z.string().default('/'),
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
        RegexValidatior,
        z.array(z.union([z.string(), RegexValidatior])),
      ]),
    )
    .optional(),
  surgeConfig: z
    .object({
      resolveHostname: z.boolean().default(false),
      vmessAEAD: z.boolean().default(true),
    })
    .optional(),
  surfboardConfig: z
    .object({
      vmessAEAD: z.boolean().default(true),
    })
    .optional(),
  quantumultXConfig: z
    .object({
      vmessAEAD: z.boolean().default(true),
    })
    .optional(),
  clashConfig: z
    .object({
      enableTuic: z.boolean().default(false),
      enableShadowTls: z.boolean().default(false),
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
  checkHostname: z.boolean().default(false),
  proxyTestUrl: z.string().url().default(PROXY_TEST_URL),
  proxyTestInterval: z.number().default(PROXY_TEST_INTERVAL),
  internetTestUrl: z.string().url().default(INTERNET_TEST_URL),
  customFilters: z
    .record(z.union([NodeFilterTypeValidator, SortedNodeFilterTypeValidator]))
    .optional(),
  customParams: z.record(z.unknown()).optional(),
  analytics: z.oboolean(),
  cache: z
    .object({
      type: z
        .union([z.literal('redis'), z.literal('default')])
        .default('default'),
      redisUrl: z
        .string()
        .regex(/rediss?/)
        .optional(),
    })
    .optional(),
});
