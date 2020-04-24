import './utils/patch-proxy';

import { bootstrap } from 'global-agent';
import Command from 'common-bin';
import fs from 'fs';
import env2 from 'env2';
import path from 'path';
import updateNotifier from 'update-notifier';
import { transports } from '@surgio/logger';

import GenerateCommand from './command/generate';
import SubscriptionsCommand from './command/subscriptions';
import UploadCommand from './command/upload';
import CheckCommand from './command/check';
import NewCommand from './command/new';
import * as filter from './utils/filter';
import { errorHandler } from './utils/error-helper';
import { CATEGORIES } from './utils/constant';

// istanbul ignore next
if (!process.env.NOW_REGION) {
  // Global proxy
  bootstrap();
}

const envPath = path.resolve(process.cwd(), './.env');

export class SurgioCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv);

    // istanbul ignore next
    if (fs.existsSync(envPath)) {
      env2(envPath);
    }

    updateNotifier({ pkg: require('../package.json') }).notify();

    this.usage = '使用方法: surgio <command> [options]';
    this.yargs.option('V', {
      alias: 'verbose',
      demandOption: false,
      describe: '打印调试日志',
      type: 'boolean',
    });

    this.load(path.join(__dirname, './command'));

    // istanbul ignore next
    if (this.yargs.argv.verbose) {
      transports.console.level = 'debug';
    }
  }

  public errorHandler(err): void {
    errorHandler.call(this, err);
  }
}

export {
  GenerateCommand,
  UploadCommand,
  CheckCommand,
  NewCommand,
  SubscriptionsCommand,
};

export const utils = {
  ...filter,
};

export const categories = {
  ...CATEGORIES,
};
