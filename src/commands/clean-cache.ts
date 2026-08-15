/* istanbul ignore file -- @preserve */
import os from 'os'
import path from 'path'
import { ux } from '@oclif/core'
import fs from 'fs-extra'

import BaseCommand from '../base-command.js'
import { TMP_FOLDER_NAME } from '../constant/index.js'
import { cleanCaches } from '../utils/cache.js'

class CleanCacheCommand extends BaseCommand<typeof CleanCacheCommand> {
  static description = '清除缓存'

  public async run(): Promise<void> {
    const tmpDir = path.join(os.tmpdir(), TMP_FOLDER_NAME)

    ux.action.start('正在清除缓存')

    if (fs.existsSync(tmpDir)) {
      await fs.remove(tmpDir)
    }

    await cleanCaches()

    ux.action.stop()

    await this.cleanup()
  }
}

export default CleanCacheCommand
