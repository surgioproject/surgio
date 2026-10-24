import { EventEmitter } from 'node:events'
import { expect, test, vi } from 'vitest'

import { UploadConfigValidator } from '../../validators/index.js'
import { resolveStorageBackend, synchronizeStorage } from '../object-storage.js'

const configCredentials = {
  accessKeyId: 'config-access-key',
  accessKeySecret: 'config-access-secret',
}

const resolve = (config: unknown, env: NodeJS.ProcessEnv = {}) =>
  resolveStorageBackend(UploadConfigValidator.parse(config), env)

test('resolves Alibaba OSS regions and endpoints', () => {
  expect(
    resolve({
      bucket: 'mainland-bucket',
      region: 'oss-cn-hangzhou',
      ...configCredentials,
    }),
  ).toEqual({
    bucket: 'mainland-bucket',
    prefix: '/',
    clientOptions: {
      accessKey: 'config-access-key',
      secretKey: 'config-access-secret',
      endPoint: 's3.oss-cn-hangzhou.aliyuncs.com',
      region: 'cn-hangzhou',
      useSSL: true,
      pathStyle: false,
    },
  })

  expect(
    resolve({
      backend: 'oss',
      bucket: 'overseas-bucket',
      region: 'eu-central-1',
      endpointType: 'internal',
      prefix: 'rules/',
      ...configCredentials,
    }).clientOptions,
  ).toMatchObject({
    endPoint: 's3.oss-eu-central-1-internal.aliyuncs.com',
    region: 'eu-central-1',
    pathStyle: false,
  })

  expect(
    resolve({
      backend: 'oss',
      bucket: 'accelerated-bucket',
      region: 'ap-southeast-1',
      endpointType: 'accelerate',
      ...configCredentials,
    }).clientOptions.endPoint,
  ).toBe('s3.oss-accelerate.aliyuncs.com')
})

test('normalizes legacy OSS endpoints and rejects bucket CNAMEs', () => {
  expect(
    resolve({
      backend: 'oss',
      bucket: 'example-bucket',
      region: 'cn-shanghai',
      endpoint: 'http://oss-cn-shanghai-internal.aliyuncs.com:8080',
      ...configCredentials,
    }).clientOptions,
  ).toMatchObject({
    endPoint: 's3.oss-cn-shanghai-internal.aliyuncs.com',
    port: 8080,
    useSSL: false,
    pathStyle: false,
  })

  expect(() =>
    resolve({
      backend: 'oss',
      bucket: 'example-bucket',
      endpoint: 'https://assets.example.com',
      ...configCredentials,
    }),
  ).toThrow('不支持 bucket CNAME')
})

test('resolves R2 standard and jurisdiction endpoints', () => {
  expect(
    resolve({
      backend: 'r2',
      bucket: 'example-bucket',
      accountId: '0123456789abcdef0123456789abcdef',
      ...configCredentials,
    }).clientOptions,
  ).toMatchObject({
    endPoint: '0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com',
    region: 'auto',
    useSSL: true,
    pathStyle: true,
  })

  expect(
    resolve({
      backend: 'r2',
      bucket: 'example-bucket',
      accountId: '0123456789abcdef0123456789abcdef',
      jurisdiction: 'fedramp',
      ...configCredentials,
    }).clientOptions.endPoint,
  ).toBe('0123456789abcdef0123456789abcdef.fedramp.r2.cloudflarestorage.com')
})

test('resolves generic S3 endpoint options', () => {
  expect(
    resolve({
      backend: 's3',
      bucket: 'example-bucket',
      endpoint: 'http://127.0.0.1:9000',
      region: 'us-east-1',
      ...configCredentials,
    }).clientOptions,
  ).toMatchObject({
    endPoint: '127.0.0.1',
    port: 9000,
    useSSL: false,
    region: 'us-east-1',
    pathStyle: true,
  })

  expect(
    resolve({
      backend: 's3',
      bucket: 'example-bucket',
      endpoint: 'https://objects.example.com',
      region: 'eu-west-1',
      pathStyle: false,
      ...configCredentials,
    }).clientOptions.pathStyle,
  ).toBe(false)

  expect(() =>
    resolve({
      backend: 's3',
      bucket: 'example-bucket',
      endpoint: 'https://objects.example.com/base',
      region: 'us-east-1',
      ...configCredentials,
    }),
  ).toThrow('不能包含认证信息、路径、查询参数或锚点')
})

test('prefers S3 backend environment credentials and requires both', () => {
  const backend = resolve(
    {
      backend: 'r2',
      bucket: 'example-bucket',
      accountId: '0123456789abcdef0123456789abcdef',
      ...configCredentials,
    },
    {
      S3_BACKEND_ACCESS_KEY_ID: 'env-access-key',
      S3_BACKEND_ACCESS_KEY_SECRET: 'env-access-secret',
    },
  )

  expect(backend.clientOptions).toMatchObject({
    accessKey: 'env-access-key',
    secretKey: 'env-access-secret',
  })
  expect(() =>
    resolve({
      backend: 'r2',
      bucket: 'example-bucket',
      accountId: '0123456789abcdef0123456789abcdef',
    }),
  ).toThrow('S3_BACKEND_ACCESS_KEY_ID')
})

const createStorageClient = (
  items: Array<{ name: string } | { prefix: string }>,
  removeResults: unknown[] = [],
) => {
  const stream = new EventEmitter()
  const client = {
    fPutObject: vi.fn().mockResolvedValue({ etag: 'etag' }),
    listObjectsV2: vi.fn(() => {
      queueMicrotask(() => {
        for (const item of items) stream.emit('data', item)
        stream.emit('end')
      })
      return stream
    }),
    removeObjects: vi.fn().mockResolvedValue(removeResults),
  }

  return client as unknown as Parameters<typeof synchronizeStorage>[0]
}

test('uploads files and deletes every stale direct object', async () => {
  const staleObjects = Array.from({ length: 125 }, (_, index) => ({
    name: `/stale-${index}.conf`,
  }))
  const client = createStorageClient([
    { name: '/current.conf' },
    { prefix: '/nested/' },
    ...staleObjects,
  ])

  await synchronizeStorage(client, { bucket: 'example-bucket', prefix: '/' }, [
    { fileName: 'current.conf', filePath: '/tmp/current.conf' },
  ])

  expect(client.fPutObject).toHaveBeenCalledWith(
    'example-bucket',
    '/current.conf',
    '/tmp/current.conf',
    {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'private, no-cache, no-store',
    },
  )
  expect(client.listObjectsV2).toHaveBeenCalledWith(
    'example-bucket',
    '/',
    false,
  )
  expect(client.removeObjects).toHaveBeenCalledWith(
    'example-bucket',
    staleObjects.map((item) => item.name),
  )
})

test('does not issue an empty delete request', async () => {
  const client = createStorageClient([{ name: 'rules/current.conf' }])

  await synchronizeStorage(
    client,
    { bucket: 'example-bucket', prefix: 'rules/' },
    [{ fileName: 'current.conf', filePath: '/tmp/current.conf' }],
  )

  expect(client.removeObjects).not.toHaveBeenCalled()
})

test('fails when the backend reports object deletion errors', async () => {
  const client = createStorageClient(
    [{ name: '/stale.conf' }],
    [
      {
        Error: {
          Key: '/stale.conf',
          Code: 'AccessDenied',
          Message: 'denied',
        },
      },
    ],
  )

  await expect(
    synchronizeStorage(client, { bucket: 'example-bucket', prefix: '/' }, []),
  ).rejects.toThrow('/stale.conf: AccessDenied (denied)')
})

test('propagates object listing stream errors', async () => {
  const stream = new EventEmitter()
  const client = {
    fPutObject: vi.fn(),
    listObjectsV2: vi.fn(() => {
      queueMicrotask(() => stream.emit('error', new Error('list failed')))
      return stream
    }),
    removeObjects: vi.fn(),
  } as unknown as Parameters<typeof synchronizeStorage>[0]

  await expect(
    synchronizeStorage(client, { bucket: 'example-bucket', prefix: '/' }, []),
  ).rejects.toThrow('list failed')
})
