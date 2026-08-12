import { CommandConfig } from '../types'

export interface OssUploadCredentials {
  readonly type: 'oss'
  readonly prefix: string
  readonly bucket: string
  readonly region?: string
  readonly endpoint?: string
  readonly accessKeyId: string
  readonly accessKeySecret: string
}

export interface R2UploadCredentials {
  readonly type: 'r2'
  readonly prefix: string
  readonly bucket: string
  readonly endpoint: string
  readonly accessKeyId: string
  readonly secretAccessKey: string
}

export type UploadCredentials = OssUploadCredentials | R2UploadCredentials

/**
 * 解析上传凭证，优先使用阿里云 OSS 配置，未配置时回退至 Cloudflare R2。
 * 这样用户可以只配置 R2 的 key 而不配置 OSS 的 key 来上传至 R2。
 */
export const resolveUploadCredentials = (
  uploadConfig: CommandConfig['upload'],
  env: NodeJS.ProcessEnv = process.env,
): UploadCredentials => {
  const prefix = uploadConfig?.prefix || '/'
  const ossAccessKeyId = env.OSS_ACCESS_KEY_ID ?? uploadConfig?.accessKeyId
  const ossAccessKeySecret =
    env.OSS_ACCESS_KEY_SECRET ?? uploadConfig?.accessKeySecret

  if (ossAccessKeyId && ossAccessKeySecret) {
    if (!uploadConfig?.bucket) {
      throw new Error('请在配置文件中配置阿里云 OSS 的 bucket')
    }

    return {
      type: 'oss',
      prefix,
      bucket: uploadConfig.bucket,
      region: uploadConfig.region,
      endpoint: uploadConfig.endpoint,
      accessKeyId: ossAccessKeyId,
      accessKeySecret: ossAccessKeySecret,
    }
  }

  const r2AccessKeyId = env.R2_ACCESS_KEY_ID ?? uploadConfig?.r2?.accessKeyId
  const r2SecretAccessKey =
    env.R2_SECRET_ACCESS_KEY ?? uploadConfig?.r2?.secretAccessKey

  if (r2AccessKeyId && r2SecretAccessKey) {
    const r2AccountId = env.R2_ACCOUNT_ID ?? uploadConfig?.r2?.accountId
    const r2Bucket = env.R2_BUCKET ?? uploadConfig?.r2?.bucket
    const endpoint =
      env.R2_ENDPOINT ??
      uploadConfig?.r2?.endpoint ??
      (r2AccountId
        ? `https://${r2AccountId}.r2.cloudflarestorage.com`
        : undefined)

    if (!endpoint) {
      throw new Error(
        '请在配置文件中配置 Cloudflare R2 的 accountId 或 endpoint',
      )
    }
    if (!r2Bucket) {
      throw new Error('请在配置文件中配置 Cloudflare R2 的 bucket')
    }

    return {
      type: 'r2',
      prefix,
      bucket: r2Bucket,
      endpoint,
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    }
  }

  throw new Error(
    '请在配置文件中配置阿里云 OSS 的 accessKeyId 和 accessKeySecret，或 Cloudflare R2 的 accessKeyId、secretAccessKey 以及 accountId（或 endpoint）',
  )
}
