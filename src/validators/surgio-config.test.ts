import { expect, test } from 'vitest'

import { UploadConfigValidator } from './surgio-config.js'

const credentials = {
  accessKeyId: 'access-key',
  accessKeySecret: 'access-secret',
}

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
