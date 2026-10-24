import { expect, test } from 'vitest'

import {
  CacheConfigValidator,
  ClashCoreValidator,
  SurgioConfigValidator,
  UploadConfigValidator,
} from './surgio-config.js'

const credentials = {
  accessKeyId: 'access-key',
  accessKeySecret: 'access-secret',
}

test.each(['clash', 'clash.meta', 'stash'] as const)(
  'preserves canonical Clash core value %s',
  (clashCore) => {
    expect(ClashCoreValidator.parse(clashCore)).toBe(clashCore)
  },
)

test('normalizes mihomo Clash core alias', () => {
  expect(ClashCoreValidator.parse('mihomo')).toBe('clash.meta')
  expect(
    SurgioConfigValidator.parse({
      artifacts: [],
      clashConfig: { clashCore: 'mihomo' },
    }).clashConfig?.clashCore,
  ).toBe('clash.meta')
})

test('rejects unknown Clash core values', () => {
  expect(ClashCoreValidator.safeParse('clash-meta').success).toBe(false)
})

test('validates and defaults Alibaba OSS upload config', () => {
  expect(
    UploadConfigValidator.parse({
      bucket: 'example-bucket',
      ...credentials,
    }),
  ).toEqual({
    bucket: 'example-bucket',
    region: 'cn-hangzhou',
    ...credentials,
  })

  expect(
    UploadConfigValidator.safeParse({
      backend: 'oss',
      bucket: 'example-bucket',
      region: 'eu-central-1',
      endpointType: 'internal',
      ...credentials,
    }).success,
  ).toBe(true)
})

test('validates R2 and generic S3 upload config', () => {
  expect(
    UploadConfigValidator.safeParse({
      backend: 'r2',
      bucket: 'example-bucket',
      accountId: '0123456789abcdef0123456789abcdef',
      jurisdiction: 'eu',
    }).success,
  ).toBe(true)

  expect(
    UploadConfigValidator.safeParse({
      backend: 's3',
      bucket: 'example-bucket',
      endpoint: 'http://localhost:9000',
      region: 'us-east-1',
      pathStyle: false,
    }).success,
  ).toBe(true)
})

test('rejects missing and cross-backend fields', () => {
  expect(
    UploadConfigValidator.safeParse({
      backend: 'r2',
      bucket: 'example-bucket',
      accountId: 'not-an-account-id',
    }).success,
  ).toBe(false)
  expect(
    UploadConfigValidator.safeParse({
      backend: 's3',
      bucket: 'example-bucket',
      endpoint: 'objects.example.com',
      region: 'us-east-1',
    }).success,
  ).toBe(false)
  expect(
    UploadConfigValidator.safeParse({
      backend: 'r2',
      bucket: 'example-bucket',
      accountId: '0123456789abcdef0123456789abcdef',
      region: 'auto',
    }).success,
  ).toBe(false)
  expect(
    UploadConfigValidator.safeParse({
      backend: 'oss',
      bucket: 'example-bucket',
      pathStyle: false,
    }).success,
  ).toBe(false)
})

test('validates filesystem and legacy default cache configs', () => {
  expect(CacheConfigValidator.parse({})).toEqual({})
  expect(
    CacheConfigValidator.parse({
      type: 'filesystem',
      directory: '/tmp/surgio-cache',
    }),
  ).toEqual({
    type: 'filesystem',
    directory: '/tmp/surgio-cache',
  })
  expect(CacheConfigValidator.safeParse({ type: 'default' }).success).toBe(true)
})

test('validates the Upstash cache config', () => {
  expect(
    CacheConfigValidator.safeParse({
      type: 'upstash',
      upstashRestUrl: 'https://example.upstash.io',
      upstashRestToken: 'token',
    }).success,
  ).toBe(true)
})

test('validates the Redis cache config', () => {
  expect(CacheConfigValidator.safeParse({ type: 'redis' }).success).toBe(true)
  expect(
    CacheConfigValidator.safeParse({
      type: 'redis',
      redisUrl: 'redis://localhost:6379',
    }).success,
  ).toBe(true)
  expect(
    CacheConfigValidator.safeParse({
      type: 'redis',
      redisUrl: 'rediss://:password@example.com:6380/1',
    }).success,
  ).toBe(true)

  expect(
    CacheConfigValidator.safeParse({
      type: 'redis',
      redisUrl: 'http://localhost:6379',
    }).success,
  ).toBe(false)
  expect(
    CacheConfigValidator.safeParse({
      type: 'redis',
      redisUrl: 'redis://localhost:6379',
      upstashRestToken: 'token',
    }).success,
  ).toBe(false)
  expect(
    CacheConfigValidator.safeParse({
      type: 'filesystem',
      redisUrl: 'redis://localhost:6379',
    }).success,
  ).toBe(false)
})

const authProvider = async () => ({ success: false as const })

test('gateway.authProvider 保留函数引用', () => {
  const parsed = SurgioConfigValidator.parse({
    artifacts: [],
    gateway: { auth: true, accessToken: 'admin', authProvider },
  })
  expect(parsed.gateway?.authProvider).toBe(authProvider)
})

test.each([
  [
    { auth: true, accessToken: 'admin', viewerToken: 'v', authProvider },
    'authProvider 与 viewerToken 不能同时配置',
  ],
  [
    { accessToken: 'admin', authProvider },
    'authProvider 需要同时开启 gateway.auth',
  ],
  [
    { auth: true, authProvider },
    'authProvider 需要同时配置 gateway.accessToken',
  ],
])('gateway.authProvider 配置约束 %#', (gateway, message) => {
  expect(() => SurgioConfigValidator.parse({ artifacts: [], gateway })).toThrow(
    message,
  )
})

test('gateway.authProvider 必须是函数', () => {
  expect(() =>
    SurgioConfigValidator.parse({
      artifacts: [],
      gateway: { auth: true, accessToken: 'admin', authProvider: 'nope' },
    }),
  ).toThrow()
})
