import test from 'ava'

import { OssUploadCredentials, resolveUploadCredentials } from '../upload'

test('throws when nothing is configured', (t) => {
  t.throws(() => resolveUploadCredentials(undefined, {}), {
    message: /阿里云 OSS|Cloudflare R2/,
  })
})

test('resolves OSS credentials from config', (t) => {
  const credentials = resolveUploadCredentials(
    {
      bucket: 'my-bucket',
      region: 'oss-cn-hangzhou',
      accessKeyId: 'oss-key',
      accessKeySecret: 'oss-secret',
    },
    {},
  )

  t.deepEqual(credentials, {
    type: 'oss',
    prefix: '/',
    bucket: 'my-bucket',
    region: 'oss-cn-hangzhou',
    endpoint: undefined,
    accessKeyId: 'oss-key',
    accessKeySecret: 'oss-secret',
  })
})

test('resolves OSS credentials from env vars and env overrides config', (t) => {
  const credentials = resolveUploadCredentials(
    {
      bucket: 'my-bucket',
      accessKeyId: 'config-key',
      accessKeySecret: 'config-secret',
    },
    {
      OSS_ACCESS_KEY_ID: 'env-key',
      OSS_ACCESS_KEY_SECRET: 'env-secret',
    },
  )

  t.is(credentials.type, 'oss')

  const oss = credentials as OssUploadCredentials
  t.is(oss.accessKeyId, 'env-key')
  t.is(oss.accessKeySecret, 'env-secret')
})

test('throws when OSS keys are present but bucket is missing', (t) => {
  t.throws(
    () =>
      resolveUploadCredentials(
        {
          accessKeyId: 'oss-key',
          accessKeySecret: 'oss-secret',
        },
        {},
      ),
    { message: /bucket/ },
  )
})

test('falls back to Cloudflare R2 when OSS keys are not configured', (t) => {
  const credentials = resolveUploadCredentials(
    {
      r2: {
        accountId: 'account-id',
        bucket: 'r2-bucket',
        accessKeyId: 'r2-key',
        secretAccessKey: 'r2-secret',
      },
    },
    {},
  )

  t.deepEqual(credentials, {
    type: 'r2',
    prefix: '/',
    bucket: 'r2-bucket',
    endpoint: 'https://account-id.r2.cloudflarestorage.com',
    accessKeyId: 'r2-key',
    secretAccessKey: 'r2-secret',
  })
})

test('resolves Cloudflare R2 credentials purely from env vars', (t) => {
  const credentials = resolveUploadCredentials(undefined, {
    R2_ACCOUNT_ID: 'account-id',
    R2_BUCKET: 'r2-bucket',
    R2_ACCESS_KEY_ID: 'r2-key',
    R2_SECRET_ACCESS_KEY: 'r2-secret',
  })

  t.deepEqual(credentials, {
    type: 'r2',
    prefix: '/',
    bucket: 'r2-bucket',
    endpoint: 'https://account-id.r2.cloudflarestorage.com',
    accessKeyId: 'r2-key',
    secretAccessKey: 'r2-secret',
  })
})

test('allows overriding the R2 endpoint explicitly', (t) => {
  const credentials = resolveUploadCredentials(
    {
      r2: {
        endpoint: 'https://custom.example.com',
        bucket: 'r2-bucket',
        accessKeyId: 'r2-key',
        secretAccessKey: 'r2-secret',
      },
    },
    {},
  )

  t.is(credentials.type, 'r2')
  t.is(credentials.endpoint, 'https://custom.example.com')
})

test('throws when R2 keys are present but accountId/endpoint is missing', (t) => {
  t.throws(
    () =>
      resolveUploadCredentials(
        {
          r2: {
            bucket: 'r2-bucket',
            accessKeyId: 'r2-key',
            secretAccessKey: 'r2-secret',
          },
        },
        {},
      ),
    { message: /accountId|endpoint/ },
  )
})

test('throws when R2 keys are present but bucket is missing', (t) => {
  t.throws(
    () =>
      resolveUploadCredentials(
        {
          r2: {
            accountId: 'account-id',
            accessKeyId: 'r2-key',
            secretAccessKey: 'r2-secret',
          },
        },
        {},
      ),
    { message: /bucket/ },
  )
})

test('prefers OSS credentials when both OSS and R2 are configured', (t) => {
  const credentials = resolveUploadCredentials(
    {
      bucket: 'oss-bucket',
      accessKeyId: 'oss-key',
      accessKeySecret: 'oss-secret',
      r2: {
        accountId: 'account-id',
        bucket: 'r2-bucket',
        accessKeyId: 'r2-key',
        secretAccessKey: 'r2-secret',
      },
    },
    {},
  )

  t.is(credentials.type, 'oss')
})

test('respects custom prefix', (t) => {
  const credentials = resolveUploadCredentials(
    {
      prefix: 'sub/',
      r2: {
        accountId: 'account-id',
        bucket: 'r2-bucket',
        accessKeyId: 'r2-key',
        secretAccessKey: 'r2-secret',
      },
    },
    {},
  )

  t.is(credentials.prefix, 'sub/')
})
