/* istanbul ignore file -- @preserve */
import path from 'path'
import { Flags } from '@oclif/core'
import { Client } from 'minio'
import dir from 'node-dir'

import BaseCommand from '../base-command.js'
import { setConfig } from '../config.js'
import {
  resolveStorageBackend,
  synchronizeStorage,
} from '../utils/object-storage.js'

class UploadCommand extends BaseCommand<typeof UploadCommand> {
  static description = '上传规则到对象存储'

  public async run(): Promise<void> {
    const config = this.surgioConfig

    if (this.flags.output) {
      setConfig('output', this.flags.output)
    }

    if (!config.upload) {
      throw new Error('请在配置文件中配置 upload')
    }

    const backend = resolveStorageBackend(config.upload)
    const client = new Client(backend.clientOptions)
    const fileList = await dir.promiseFiles(config.output)
    const files = fileList.map((filePath) => ({
      fileName: path.basename(filePath),
      filePath,
    }))

    this.ora.start('开始上传到对象存储')
    await synchronizeStorage(client, backend, files)

    await this.cleanup()
  }
}

UploadCommand.flags = {
  output: Flags.string({
    char: 'o',
    description: '生成规则的目录',
  }),
}

export default UploadCommand
