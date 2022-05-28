// istanbul ignore file
import Command from 'common-bin';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { logger } from '@surgio/logger';

import { TMP_FOLDER_NAME } from '../constant';
import redis from '../redis';
import { cleanCaches } from '../utils/cache';
import { defineGlobalOptions } from '../utils/command';
import { loadConfig } from '../utils/config';
import { errorHandler } from '../utils/error-helper';

class CleanCacheCommand extends Command {
  constructor(rawArgv?: string[]) {
    super(rawArgv);
    this.usage = '使用方法: surgio clean-cache';

    defineGlobalOptions(this.yargs);
  }

  // istanbul ignore next
  public get description(): string {
    return '清除缓存';
  }

  public async run(ctx): Promise<void> {
    const tmpDir = path.join(os.tmpdir(), TMP_FOLDER_NAME);

    loadConfig(ctx.cwd, ctx.argv.config);

    if (fs.existsSync(tmpDir)) {
      await fs.remove(tmpDir);
    }

    await cleanCaches();

    logger.info('清除成功');

    await redis.destroyRedis();
  }

  // istanbul ignore next
  public errorHandler(err): void {
    errorHandler.call(this, err);
  }
}

export = CleanCacheCommand;
