import { z } from 'zod/v3'

import { ArtifactValidator } from './artifact.js'
import {
  NodeFilterTypeValidator,
  SortedNodeFilterTypeValidator,
} from './filter.js'

const isRegExp = (val: unknown): val is RegExp => {
  return val instanceof RegExp
}
const RegexValidatior = z.custom<RegExp>((val) => {
  return isRegExp(val)
})

export const ClashCoreValidator = z.union([
  z.literal('clash'),
  z.literal('clash.meta'),
  z.literal('stash'),
  z.literal('mihomo').transform(() => 'clash.meta' as const),
])

export const RemoteSnippetValidator = z.object({
  name: z.string(),
  url: z.string().url(),
  surgioSnippet: z.oboolean(),
})

export const ClashConfigValidator = z.object({
  enableTuic: z.oboolean(),
  enableShadowTls: z.oboolean(),
  enableHysteria2: z.oboolean(),
  enableVless: z.oboolean(),
  clashCore: ClashCoreValidator.optional(),
})

export const SurgeConfigValidator = z.object({
  vmessAEAD: z.oboolean(),
})

export const SurfboardConfigValidator = z.object({
  vmessAEAD: z.oboolean(),
})

export const QuantumultXConfigValidator = z.object({
  vmessAEAD: z.oboolean(),
})

const UploadCommonShape = {
  prefix: z.ostring(),
  bucket: z.string().min(1),
  accessKeyId: z.ostring(),
  accessKeySecret: z.ostring(),
}

export const OssUploadConfigValidator = z
  .object({
    ...UploadCommonShape,
    backend: z.literal('oss').optional(),
    region: z.string().min(1).default('cn-hangzhou'),
    endpointType: z
      .union([
        z.literal('public'),
        z.literal('internal'),
        z.literal('accelerate'),
      ])
      .optional(),
    endpoint: z.ostring(),
  })
  .strict()

export const R2UploadConfigValidator = z
  .object({
    ...UploadCommonShape,
    backend: z.literal('r2'),
    accountId: z.string().regex(/^[a-f\d]{32}$/i),
    jurisdiction: z.union([z.literal('eu'), z.literal('fedramp')]).optional(),
  })
  .strict()

export const S3UploadConfigValidator = z
  .object({
    ...UploadCommonShape,
    backend: z.literal('s3'),
    endpoint: z.string().url(),
    region: z.string().min(1),
    pathStyle: z.oboolean(),
  })
  .strict()

export const UploadConfigValidator = z.union([
  OssUploadConfigValidator,
  R2UploadConfigValidator,
  S3UploadConfigValidator,
])

export const CacheConfigValidator = z.union([
  z
    .object({
      type: z.union([z.literal('default'), z.literal('filesystem')]).optional(),
      directory: z.string().min(1).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal('upstash'),
      upstashRestUrl: z.string().url().optional(),
      upstashRestToken: z.string().min(1).optional(),
    })
    .strict(),
])

export const SurgioConfigValidator = z.object({
  artifacts: z.array(ArtifactValidator),
  remoteSnippets: z.array(RemoteSnippetValidator).optional(),
  urlBase: z.ostring(),
  upload: UploadConfigValidator.optional(),
  flags: z
    .record(
      z.union([
        z.string(),
        RegexValidatior,
        z.array(z.union([z.string(), RegexValidatior])),
      ]),
    )
    .optional(),
  surgeConfig: SurgeConfigValidator.optional(),
  surfboardConfig: SurfboardConfigValidator.optional(),
  quantumultXConfig: QuantumultXConfigValidator.optional(),
  clashConfig: ClashConfigValidator.optional(),
  gateway: z
    .object({
      accessToken: z.ostring(),
      viewerToken: z.ostring(),
      auth: z.oboolean(),
      cookieMaxAge: z.onumber(),
      useCacheOnError: z.oboolean(),
      passRequestUserAgent: z.oboolean(),
      passRequestHeaders: z
        .array(z.string())
        .default([])
        .transform((val) => val.map((item) => item.toLowerCase())),
    })
    .optional(),
  checkHostname: z.oboolean(),
  resolveHostname: z.oboolean(),
  proxyTestUrl: z.string().url().optional(),
  proxyTestInterval: z.onumber(),
  internetTestUrl: z.string().url().optional(),
  internetTestInterval: z.onumber(),
  customFilters: z
    .record(z.union([NodeFilterTypeValidator, SortedNodeFilterTypeValidator]))
    .optional(),
  customParams: z.record(z.any()).optional(),
  analytics: z.oboolean(),
  cache: CacheConfigValidator.optional(),
})
