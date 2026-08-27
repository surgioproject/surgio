// istanbul ignore file
import path from 'path'
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Flags } from '@oclif/core'
import fs from 'fs-extra'
import dir from 'node-dir'

import BaseCommand from '../base-command'
import { setConfig } from '../config'
import {
  S3UploadCredentials,
  describeUploadTarget,
  resolveUploadCredentials,
} from '../utils/upload'

/** DeleteObjects 单次请求最多删除 1000 个对象 */
const DELETE_BATCH_SIZE = 1000

interface FileItem {
  fileName: string
  filePath: string
}

class UploadCommand extends BaseCommand<typeof UploadCommand> {
  static description = '上传规则到 S3 兼容的对象存储'

  public async run(): Promise<void> {
    const config = this.surgioConfig

    if (this.flags.output) {
      setConfig('output', this.flags.output)
    }

    const credentials = resolveUploadCredentials(config?.upload)
    const fileList = await dir.promiseFiles(config.output)
    const files: ReadonlyArray<FileItem> = fileList.map((filePath: any) => ({
      fileName: path.basename(filePath),
      filePath,
    }))

    this.ora.start(`开始上传到${describeUploadTarget(credentials)}`)

    const client = new S3Client({
      region: credentials.region,
      endpoint: credentials.endpoint,
      forcePathStyle: credentials.forcePathStyle,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
      // 多数 S3 兼容服务不支持 AWS 的 flexible checksums，
      // 只在协议要求时（如 DeleteObjects）才附带校验和。
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    })

    try {
      await this.upload(client, credentials, files)
      await this.deleteUnwanted(
        client,
        credentials,
        files.map((file) => file.fileName),
      )
    } finally {
      client.destroy()
    }

    await this.cleanup()
  }

  private async upload(
    client: S3Client,
    credentials: S3UploadCredentials,
    files: ReadonlyArray<FileItem>,
  ): Promise<void> {
    await Promise.all(
      files.map(async (file) => {
        const body = await fs.readFile(file.filePath)

        return client.send(
          new PutObjectCommand({
            Bucket: credentials.bucket,
            Key: `${credentials.keyPrefix}${file.fileName}`,
            Body: body,
            ContentType: 'text/plain; charset=utf-8',
            CacheControl: 'private, no-cache, no-store',
          }),
        )
      }),
    )
  }

  /** 删除 prefix 下已经不存在于本地的规则文件 */
  private async deleteUnwanted(
    client: S3Client,
    credentials: S3UploadCredentials,
    fileNameList: ReadonlyArray<string>,
  ): Promise<void> {
    const { bucket, keyPrefix } = credentials
    const deleteList: { Key: string }[] = []
    let continuationToken: string | undefined

    do {
      const list = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: keyPrefix,
          Delimiter: '/',
          ContinuationToken: continuationToken,
        }),
      )

      for (const object of list.Contents ?? []) {
        if (!object.Key) {
          continue
        }

        const objectName = object.Key.slice(keyPrefix.length)

        if (objectName && !fileNameList.includes(objectName)) {
          deleteList.push({ Key: object.Key })
        }
      }

      continuationToken = list.IsTruncated
        ? list.NextContinuationToken
        : undefined
    } while (continuationToken)

    for (let i = 0; i < deleteList.length; i += DELETE_BATCH_SIZE) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: deleteList.slice(i, i + DELETE_BATCH_SIZE) },
        }),
      )
    }
  }
}

UploadCommand.flags = {
  output: Flags.string({
    char: 'o',
    description: '生成规则的目录',
  }),
}

export default UploadCommand
