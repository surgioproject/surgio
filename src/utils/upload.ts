import { CommandConfig } from '../types'

export interface S3UploadCredentials {
  /** 配置文件中的 prefix，保留原始形式（以 / 结尾） */
  readonly prefix: string
  /** 去掉开头斜杠后的 object key 前缀，S3 的 key 不应以 / 开头 */
  readonly keyPrefix: string
  readonly bucket: string
  readonly region: string
  readonly endpoint?: string
  readonly accessKeyId: string
  readonly secretAccessKey: string
  readonly forcePathStyle: boolean
}

/** 阿里云 OSS 的 region，形如 oss-cn-hangzhou、vpc100-oss-cn-hangzhou */
const ALIYUN_OSS_REGION = /^(vpc100-)?oss-/

/**
 * S3 协议要求请求签名中带有 region，而多数 S3 兼容服务并不使用它。
 * 与 Cloudflare R2 的官方示例保持一致，默认填 auto。
 */
const DEFAULT_REGION = 'auto'

const isTruthy = (value: string | undefined): boolean | undefined => {
  if (value === undefined) {
    return undefined
  }
  return ['1', 'true', 'yes'].includes(value.toLowerCase())
}

/**
 * 解析上传凭证。所有对象存储都通过 S3 兼容 API 上传，
 * 因此这里只需要把配置归一成一份 S3 凭证。
 *
 * 同时兼容阿里云 OSS 的旧字段：accessKeySecret 等价于 secretAccessKey，
 * OSS_* 环境变量等价于 S3_*，只填 region 时按 ali-oss 的规则推导 endpoint。
 */
export const resolveUploadCredentials = (
  uploadConfig: CommandConfig['upload'],
  env: NodeJS.ProcessEnv = process.env,
): S3UploadCredentials => {
  const accessKeyId =
    env.S3_ACCESS_KEY_ID ?? env.OSS_ACCESS_KEY_ID ?? uploadConfig?.accessKeyId
  const secretAccessKey =
    env.S3_SECRET_ACCESS_KEY ??
    env.OSS_ACCESS_KEY_SECRET ??
    uploadConfig?.secretAccessKey ??
    uploadConfig?.accessKeySecret

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      '请在配置文件中配置对象存储的 accessKeyId 和 secretAccessKey，' +
        '也可以通过环境变量 S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY 提供',
    )
  }

  const region = env.S3_REGION || uploadConfig?.region || DEFAULT_REGION
  const endpoint =
    env.S3_ENDPOINT ??
    uploadConfig?.endpoint ??
    (ALIYUN_OSS_REGION.test(region)
      ? `https://${region}.aliyuncs.com`
      : undefined)

  if (!endpoint && region === DEFAULT_REGION) {
    throw new Error(
      '请在配置文件中配置对象存储的 endpoint，' +
        '也可以通过环境变量 S3_ENDPOINT 提供；使用 Amazon S3 时也可以只配置 region',
    )
  }

  const bucket = env.S3_BUCKET ?? uploadConfig?.bucket

  if (!bucket) {
    throw new Error(
      '请在配置文件中配置对象存储的 bucket，也可以通过环境变量 S3_BUCKET 提供',
    )
  }

  const prefix = uploadConfig?.prefix || '/'

  return {
    prefix,
    keyPrefix: prefix === '/' ? '' : prefix.replace(/^\/+/, ''),
    bucket,
    region,
    endpoint,
    accessKeyId,
    secretAccessKey,
    forcePathStyle:
      isTruthy(env.S3_FORCE_PATH_STYLE) ??
      uploadConfig?.forcePathStyle ??
      false,
  }
}

/** 根据 endpoint 猜出服务商名字，仅用于命令行提示 */
export const describeUploadTarget = (
  credentials: S3UploadCredentials,
): string => {
  const endpoint = credentials.endpoint

  if (!endpoint || endpoint.includes('amazonaws.com')) {
    return 'Amazon S3'
  }
  if (endpoint.includes('aliyuncs.com')) {
    return '阿里云 OSS'
  }
  if (endpoint.includes('r2.cloudflarestorage.com')) {
    return 'Cloudflare R2'
  }
  if (endpoint.includes('myqcloud.com')) {
    return '腾讯云 COS'
  }
  if (endpoint.includes('myhuaweicloud.com')) {
    return '华为云 OBS'
  }

  return 'S3 兼容对象存储'
}
