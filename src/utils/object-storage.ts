import type { Client, ClientOptions } from 'minio'
import type { CommandConfig } from '../types.js'

type UploadConfig = NonNullable<CommandConfig['upload']>

export interface StorageBackend {
  readonly bucket: string
  readonly prefix: string
  readonly clientOptions: ClientOptions
}

export interface StorageFile {
  readonly fileName: string
  readonly filePath: string
}

type StorageClient = Pick<
  Client,
  'fPutObject' | 'listObjectsV2' | 'removeObjects'
>
type RemoveObjectsResults = Awaited<ReturnType<StorageClient['removeObjects']>>

const DEFAULT_OSS_REGION = 'cn-hangzhou'
const OSS_ENDPOINT_PATTERN = /^(?:s3\.)?oss-(?:[a-z\d-]+)\.aliyuncs\.com$/i

const normalizeOssRegion = (region = DEFAULT_OSS_REGION): string =>
  region.replace(/^oss-/, '')

const parseEndpoint = (endpoint: string, allowHostname = false) => {
  const value =
    allowHostname && !/^https?:\/\//i.test(endpoint)
      ? `https://${endpoint}`
      : endpoint
  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw new Error(`无效的对象存储 endpoint: ${endpoint}`)
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('对象存储 endpoint 仅支持 HTTP 或 HTTPS')
  }
  if (
    url.username ||
    url.password ||
    (url.pathname && url.pathname !== '/') ||
    url.search ||
    url.hash
  ) {
    throw new Error('对象存储 endpoint 不能包含认证信息、路径、查询参数或锚点')
  }

  return {
    endPoint: url.hostname,
    ...(url.port ? { port: Number(url.port) } : null),
    useSSL: url.protocol === 'https:',
  }
}

const resolveOssEndpoint = (
  config: Extract<UploadConfig, { backend?: 'oss' }>,
  region: string,
) => {
  if (!config.endpoint) {
    const endPoint =
      config.endpointType === 'accelerate'
        ? 's3.oss-accelerate.aliyuncs.com'
        : `s3.oss-${region}${
            config.endpointType === 'internal' ? '-internal' : ''
          }.aliyuncs.com`

    return { endPoint, useSSL: true }
  }

  const parsed = parseEndpoint(config.endpoint, true)
  let endPoint = parsed.endPoint.toLowerCase()

  if (!OSS_ENDPOINT_PATTERN.test(endPoint)) {
    throw new Error(
      'OSS endpoint 必须是服务级 S3 兼容 endpoint，不支持 bucket CNAME',
    )
  }
  if (!endPoint.startsWith('s3.')) {
    endPoint = `s3.${endPoint}`
  }

  return { ...parsed, endPoint }
}

export const resolveStorageBackend = (
  config: UploadConfig,
  env: NodeJS.ProcessEnv = process.env,
): StorageBackend => {
  const accessKey = env.S3_BACKEND_ACCESS_KEY_ID ?? config.accessKeyId
  const secretKey = env.S3_BACKEND_ACCESS_KEY_SECRET ?? config.accessKeySecret

  if (!accessKey || !secretKey) {
    throw new Error(
      '请配置 S3_BACKEND_ACCESS_KEY_ID 和 S3_BACKEND_ACCESS_KEY_SECRET',
    )
  }

  const common = {
    accessKey,
    secretKey,
  }
  const prefix = config.prefix || '/'

  switch (config.backend) {
    case 'r2': {
      const jurisdiction = config.jurisdiction ? `.${config.jurisdiction}` : ''

      return {
        bucket: config.bucket,
        prefix,
        clientOptions: {
          ...common,
          endPoint: `${config.accountId}${jurisdiction}.r2.cloudflarestorage.com`,
          region: 'auto',
          useSSL: true,
          pathStyle: true,
        },
      }
    }
    case 's3':
      return {
        bucket: config.bucket,
        prefix,
        clientOptions: {
          ...common,
          ...parseEndpoint(config.endpoint),
          region: config.region,
          pathStyle: config.pathStyle ?? true,
        },
      }
    case 'oss':
    case undefined: {
      const region = normalizeOssRegion(config.region)

      return {
        bucket: config.bucket,
        prefix,
        clientOptions: {
          ...common,
          ...resolveOssEndpoint(config, region),
          region,
          pathStyle: false,
        },
      }
    }
  }
}

const collectObjectNames = (
  client: StorageClient,
  bucket: string,
  prefix: string,
): Promise<string[]> =>
  new Promise((resolve, reject) => {
    const objectNames: string[] = []
    const stream = client.listObjectsV2(bucket, prefix, false)

    stream.on('data', (item) => {
      if (item.name) {
        objectNames.push(item.name)
      }
    })
    stream.once('error', reject)
    stream.once('end', () => resolve(objectNames))
  })

const formatDeleteErrors = (results: RemoveObjectsResults): string | null => {
  const errors = results.flatMap((result) =>
    result?.Error ? [result.Error] : [],
  )

  if (!errors.length) return null

  return errors
    .map(
      (error) =>
        `${error.Key || 'unknown'}: ${error.Code || 'DeleteFailed'}${
          error.Message ? ` (${error.Message})` : ''
        }`,
    )
    .join(', ')
}

export const synchronizeStorage = async (
  client: StorageClient,
  backend: Pick<StorageBackend, 'bucket' | 'prefix'>,
  files: readonly StorageFile[],
): Promise<void> => {
  const expectedObjectNames = new Set(
    files.map((file) => `${backend.prefix}${file.fileName}`),
  )

  await Promise.all(
    files.map((file) =>
      client.fPutObject(
        backend.bucket,
        `${backend.prefix}${file.fileName}`,
        file.filePath,
        {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'private, no-cache, no-store',
        },
      ),
    ),
  )

  const existingObjectNames = await collectObjectNames(
    client,
    backend.bucket,
    backend.prefix,
  )
  const unwantedObjectNames = existingObjectNames.filter(
    (objectName) =>
      objectName !== backend.prefix && !expectedObjectNames.has(objectName),
  )

  if (!unwantedObjectNames.length) return

  const results = await client.removeObjects(
    backend.bucket,
    unwantedObjectNames,
  )
  const errorMessage = formatDeleteErrors(results)

  if (errorMessage) {
    throw new Error(`删除远程对象失败: ${errorMessage}`)
  }
}
