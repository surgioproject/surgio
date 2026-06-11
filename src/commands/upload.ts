// istanbul ignore file
import path from 'path'
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Flags } from '@oclif/core'
import OSS from 'ali-oss'
import fs from 'fs-extra'
import dir from 'node-dir'

import BaseCommand from '../base-command'
import { setConfig } from '../config'
import {
  OssUploadCredentials,
  R2UploadCredentials,
  resolveUploadCredentials,
} from '../utils/upload'

interface FileItem {
  fileName: string
  filePath: string
}

class UploadCommand extends BaseCommand<typeof UploadCommand> {
  static description = '上传规则到阿里云 OSS 或 Cloudflare R2'

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
    const fileNameList = files.map((file) => file.fileName)

    if (credentials.type === 'oss') {
      this.ora.start('开始上传到阿里云 OSS')
      await this.uploadToOss(credentials, files, fileNameList)
    } else {
      this.ora.start('开始上传到 Cloudflare R2')
      await this.uploadToR2(credentials, files, fileNameList)
    }

    await this.cleanup()
  }

  private async uploadToOss(
    credentials: OssUploadCredentials,
    files: ReadonlyArray<FileItem>,
    fileNameList: ReadonlyArray<string>,
  ): Promise<void> {
    const { region, endpoint, bucket, accessKeyId, accessKeySecret, prefix } =
      credentials
    const client = new OSS({
      secure: true,
      region,
      bucket,
      endpoint,
      accessKeyId,
      accessKeySecret,
    })

    await Promise.all(
      files.map((file) => {
        const objectName = `${prefix}${file.fileName}`
        const readStream = fs.createReadStream(file.filePath)

        return client.put(objectName, readStream, {
          mime: 'text/plain; charset=utf-8',
          headers: {
            'Cache-Control': 'private, no-cache, no-store',
          },
        })
      }),
    )

    const list = await client.list(
      {
        prefix,
        delimiter: '/',
        'max-keys': 100,
      },
      {},
    )
    const deleteList: string[] = []

    for (const key in list.objects) {
      if (Object.hasOwn(list.objects, key)) {
        const object = list.objects[key]
        const objectName = object.name.replace(prefix, '')
        const isExist = fileNameList.indexOf(objectName) > -1

        if (objectName && !isExist) {
          deleteList.push(object.name)
        }
      }
    }

    if (deleteList.length) {
      await client.deleteMulti(deleteList)
    }
  }

  private async uploadToR2(
    credentials: R2UploadCredentials,
    files: ReadonlyArray<FileItem>,
    fileNameList: ReadonlyArray<string>,
  ): Promise<void> {
    const { bucket, endpoint, accessKeyId, secretAccessKey, prefix } =
      credentials
    const client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
    const normalizedPrefix = prefix === '/' ? '' : prefix.replace(/^\/+/, '')

    await Promise.all(
      files.map(async (file) => {
        const objectName = `${normalizedPrefix}${file.fileName}`
        const body = await fs.readFile(file.filePath)

        return client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: objectName,
            Body: body,
            ContentType: 'text/plain; charset=utf-8',
            CacheControl: 'private, no-cache, no-store',
          }),
        )
      }),
    )

    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: normalizedPrefix,
        Delimiter: '/',
        MaxKeys: 100,
      }),
    )
    const deleteList: { Key: string }[] = []

    for (const object of list.Contents ?? []) {
      if (!object.Key) {
        continue
      }

      const objectName = object.Key.replace(normalizedPrefix, '')
      const isExist = fileNameList.indexOf(objectName) > -1

      if (objectName && !isExist) {
        deleteList.push({ Key: object.Key })
      }
    }

    if (deleteList.length) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: deleteList },
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
