import { z } from 'zod'

import { ArtifactValidator } from './artifact'
import {
  NodeFilterTypeValidator,
  SortedNodeFilterTypeValidator,
} from './filter'

const isRegExp = (val: unknown): val is RegExp => {
  return val instanceof RegExp
}
const RegexValidatior = z.custom<RegExp>((val) => {
  return isRegExp(val)
})

export const RemoteSnippetValidator = z.object({
  name: z.string(),
  url: z.string().url(),
  surgioSnippet: z.oboolean(),
})

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
        RegexValidatior,
        z.array(z.union([z.string(), RegexValidatior])),
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
      enableHysteria2: z.oboolean(),
      clashCore: z
        .union([
          z.literal('clash'),
          z.literal('clash.meta'),
          z.literal('stash'),
        ])
        .optional(),
    })
    .optional(),
  gateway: z
    .object({
      accessToken: z.ostring(),
      viewerToken: z.ostring(),
      auth: z.oboolean(),
      cookieMaxAge: z.onumber(),
      useCacheOnError: z.oboolean(),
      passRequestUserAgent: z.oboolean(),
    })
    .optional(),
  checkHostname: z.oboolean(),
  proxyTestUrl: z.string().url().optional(),
  proxyTestInterval: z.onumber(),
  internetTestUrl: z.string().url().optional(),
  internetTestInterval: z.onumber(),
  customFilters: z
    .record(z.union([NodeFilterTypeValidator, SortedNodeFilterTypeValidator]))
    .optional(),
  customParams: z.record(z.any()).optional(),
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
})
