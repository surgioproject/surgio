// istanbul ignore file
import { ux } from '@oclif/core';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';

import BaseCommand from '../base-command';
import { TMP_FOLDER_NAME } from '../constant';
import redis from '../redis';
import { cleanCaches } from '../utils/cache';

class CleanCacheCommand extends BaseCommand<typeof CleanCacheCommand> {
  static description = '清除缓存';

  public async run(): Promise<void> {
    const tmpDir = path.join(os.tmpdir(), TMP_FOLDER_NAME);

    ux.action.start('正在清除缓存');

    if (fs.existsSync(tmpDir)) {
      await fs.remove(tmpDir);
    }

    await cleanCaches();

    ux.action.stop();

    await redis.destroyRedis();
  }
}

export default CleanCacheCommand;
