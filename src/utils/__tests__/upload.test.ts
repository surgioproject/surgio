import test from 'ava'

import { describeUploadTarget, resolveUploadCredentials } from '../upload'

test('throws when nothing is configured', (t) => {
  t.throws(() => resolveUploadCredentials(undefined, {}), {
    message: /accessKeyId/,
  })
})

test('resolves generic S3 credentials from config', (t) => {
  const credentials = resolveUploadCredentials(
    {
      endpoint: 'https://s3.example.com',
      bucket: 'my-bucket',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
    },
    {},
  )

  t.deepEqual(credentials, {
    prefix: '/',
    keyPrefix: '',
    bucket: 'my-bucket',
    region: 'auto',
    endpoint: 'https://s3.example.com',
    accessKeyId: 'key',
    secretAccessKey: 'secret',
    forcePathStyle: false,
  })
})

test('derives the Aliyun OSS endpoint from a legacy OSS config', (t) => {
  const credentials = resolveUploadCredentials(
    {
      bucket: 'my-bucket',
      region: 'oss-cn-hangzhou',
      accessKeyId: 'oss-key',
      accessKeySecret: 'oss-secret',
    },
    {},
  )

  t.is(credentials.endpoint, 'https://oss-cn-hangzhou.aliyuncs.com')
  t.is(credentials.region, 'oss-cn-hangzhou')
  t.is(credentials.secretAccessKey, 'oss-secret')
  t.is(describeUploadTarget(credentials), '阿里云 OSS')
})

test('keeps a real AWS region without an endpoint', (t) => {
  const credentials = resolveUploadCredentials(
    {
      bucket: 'my-bucket',
      region: 'us-east-1',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
    },
    {},
  )

  t.is(credentials.region, 'us-east-1')
  t.is(credentials.endpoint, undefined)
  t.is(describeUploadTarget(credentials), 'Amazon S3')
})

test('env vars override the config, and OSS_* still works', (t) => {
  const credentials = resolveUploadCredentials(
    {
      endpoint: 'https://config.example.com',
      bucket: 'config-bucket',
      accessKeyId: 'config-key',
      accessKeySecret: 'config-secret',
    },
    {
      S3_ENDPOINT: 'https://env.example.com',
      S3_BUCKET: 'env-bucket',
      OSS_ACCESS_KEY_ID: 'env-key',
      OSS_ACCESS_KEY_SECRET: 'env-secret',
    },
  )

  t.is(credentials.endpoint, 'https://env.example.com')
  t.is(credentials.bucket, 'env-bucket')
  t.is(credentials.accessKeyId, 'env-key')
  t.is(credentials.secretAccessKey, 'env-secret')
})

test('S3_* takes precedence over OSS_*', (t) => {
  const credentials = resolveUploadCredentials(
    { endpoint: 'https://s3.example.com', bucket: 'my-bucket' },
    {
      S3_ACCESS_KEY_ID: 's3-key',
      S3_SECRET_ACCESS_KEY: 's3-secret',
      OSS_ACCESS_KEY_ID: 'oss-key',
      OSS_ACCESS_KEY_SECRET: 'oss-secret',
    },
  )

  t.is(credentials.accessKeyId, 's3-key')
  t.is(credentials.secretAccessKey, 's3-secret')
})

test('secretAccessKey wins over the deprecated accessKeySecret', (t) => {
  const credentials = resolveUploadCredentials(
    {
      endpoint: 'https://s3.example.com',
      bucket: 'my-bucket',
      accessKeyId: 'key',
      secretAccessKey: 'new-secret',
      accessKeySecret: 'legacy-secret',
    },
    {},
  )

  t.is(credentials.secretAccessKey, 'new-secret')
})

test('throws when keys are present but bucket is missing', (t) => {
  t.throws(
    () =>
      resolveUploadCredentials(
        {
          endpoint: 'https://s3.example.com',
          accessKeyId: 'key',
          secretAccessKey: 'secret',
        },
        {},
      ),
    { message: /bucket/ },
  )
})

test('throws when neither endpoint nor region is configured', (t) => {
  t.throws(
    () =>
      resolveUploadCredentials(
        {
          bucket: 'my-bucket',
          accessKeyId: 'key',
          secretAccessKey: 'secret',
        },
        {},
      ),
    { message: /endpoint/ },
  )
})

test('reads forcePathStyle from the config and the env', (t) => {
  const base = {
    endpoint: 'https://minio.example.com',
    bucket: 'my-bucket',
    accessKeyId: 'key',
    secretAccessKey: 'secret',
  }

  t.true(
    resolveUploadCredentials({ ...base, forcePathStyle: true }, {})
      .forcePathStyle,
  )
  t.true(
    resolveUploadCredentials(base, { S3_FORCE_PATH_STYLE: 'true' })
      .forcePathStyle,
  )
  t.false(
    resolveUploadCredentials(
      { ...base, forcePathStyle: true },
      { S3_FORCE_PATH_STYLE: 'false' },
    ).forcePathStyle,
  )
})

test('normalizes the prefix into an object key prefix', (t) => {
  const base = {
    endpoint: 'https://s3.example.com',
    bucket: 'my-bucket',
    accessKeyId: 'key',
    secretAccessKey: 'secret',
  }

  t.is(
    resolveUploadCredentials({ ...base, prefix: 'sub/' }, {}).keyPrefix,
    'sub/',
  )
  t.is(
    resolveUploadCredentials({ ...base, prefix: '/sub/' }, {}).keyPrefix,
    'sub/',
  )
  t.is(resolveUploadCredentials({ ...base, prefix: '/' }, {}).keyPrefix, '')
  t.is(resolveUploadCredentials(base, {}).prefix, '/')
})

test('ignores R2_* env vars', (t) => {
  t.throws(
    () =>
      resolveUploadCredentials(undefined, {
        R2_ACCOUNT_ID: 'account-id',
        R2_BUCKET: 'r2-bucket',
        R2_ACCESS_KEY_ID: 'r2-key',
        R2_SECRET_ACCESS_KEY: 'r2-secret',
      }),
    { message: /accessKeyId/ },
  )
})

test('labels a Cloudflare R2 endpoint configured the generic way', (t) => {
  const credentials = resolveUploadCredentials(
    {
      endpoint: 'https://account-id.r2.cloudflarestorage.com',
      bucket: 'r2-bucket',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
    },
    {},
  )

  t.is(credentials.region, 'auto')
  t.is(describeUploadTarget(credentials), 'Cloudflare R2')
})
