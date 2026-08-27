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

interface CredentialCandidate {
  readonly accessKeyId?: string
  readonly secretAccessKey?: string
  readonly bucket?: string
  readonly region?: string
  readonly endpoint?: string
  /** 该来源缺少 endpoint 时的报错提示 */
  readonly endpointHint: string
}

type ResolvedCandidate = CredentialCandidate & {
  readonly accessKeyId: string
  readonly secretAccessKey: string
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
 * 通用的 S3 配置来源，同时兼容上游遗留的阿里云 OSS 字段：
 * accessKeySecret 等价于 secretAccessKey，只填 region 时按 ali-oss 的规则推导 endpoint。
 */
const resolveS3Candidate = (
  uploadConfig: CommandConfig['upload'],
  env: NodeJS.ProcessEnv,
): CredentialCandidate => {
  const region = env.S3_REGION ?? uploadConfig?.region
  const endpoint =
    env.S3_ENDPOINT ??
    uploadConfig?.endpoint ??
    (region && ALIYUN_OSS_REGION.test(region)
      ? `https://${region}.aliyuncs.com`
      : undefined)

  return {
    accessKeyId:
      env.S3_ACCESS_KEY_ID ??
      env.OSS_ACCESS_KEY_ID ??
      uploadConfig?.accessKeyId,
    secretAccessKey:
      env.S3_SECRET_ACCESS_KEY ??
      env.OSS_ACCESS_KEY_SECRET ??
      uploadConfig?.secretAccessKey ??
      uploadConfig?.accessKeySecret,
    bucket: env.S3_BUCKET ?? uploadConfig?.bucket,
    region,
    endpoint,
    endpointHint:
      '请配置对象存储的 upload.endpoint，' +
      '或通过环境变量 S3_ENDPOINT 提供；使用 Amazon S3 时也可以只配置 upload.region',
  }
}

/**
 * Cloudflare R2 的简写来源，只是替用户把 accountId 拼成 endpoint。
 * 保留它是为了兼容已有配置，新配置直接写通用的 upload.endpoint 即可。
 */
const resolveR2Candidate = (
  uploadConfig: CommandConfig['upload'],
  env: NodeJS.ProcessEnv,
): CredentialCandidate => {
  const r2Config = uploadConfig?.r2
  const accountId = env.R2_ACCOUNT_ID ?? r2Config?.accountId

  return {
    accessKeyId: env.R2_ACCESS_KEY_ID ?? r2Config?.accessKeyId,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? r2Config?.secretAccessKey,
    bucket:
      env.R2_BUCKET ??
      r2Config?.bucket ??
      env.S3_BUCKET ??
      uploadConfig?.bucket,
    region: DEFAULT_REGION,
    endpoint:
      env.R2_ENDPOINT ??
      r2Config?.endpoint ??
      (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined),
    endpointHint: '请配置 Cloudflare R2 的 accountId 或 endpoint',
  }
}

/**
 * 解析上传凭证。所有对象存储都通过 S3 兼容 API 上传，
 * 因此这里只需要把各种配置来源归一成一份 S3 凭证。
 */
export const resolveUploadCredentials = (
  uploadConfig: CommandConfig['upload'],
  env: NodeJS.ProcessEnv = process.env,
): S3UploadCredentials => {
  const candidates = [
    resolveS3Candidate(uploadConfig, env),
    resolveR2Candidate(uploadConfig, env),
  ]
  const candidate = candidates.find(
    (item): item is ResolvedCandidate =>
      Boolean(item.accessKeyId) && Boolean(item.secretAccessKey),
  )

  if (!candidate) {
    throw new Error(
      '请在配置文件中配置对象存储的 accessKeyId 和 secretAccessKey，' +
        '也可以通过环境变量 S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY 提供',
    )
  }

  const region = candidate.region || DEFAULT_REGION

  if (!candidate.endpoint && region === DEFAULT_REGION) {
    throw new Error(candidate.endpointHint)
  }

  if (!candidate.bucket) {
    throw new Error(
      '请在配置文件中配置对象存储的 bucket，也可以通过环境变量 S3_BUCKET 提供',
    )
  }

  const prefix = uploadConfig?.prefix || '/'

  return {
    prefix,
    keyPrefix: prefix === '/' ? '' : prefix.replace(/^\/+/, ''),
    bucket: candidate.bucket,
    region,
    endpoint: candidate.endpoint,
    accessKeyId: candidate.accessKeyId,
    secretAccessKey: candidate.secretAccessKey,
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
