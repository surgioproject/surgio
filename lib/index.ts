import { bootstrap } from 'global-agent';
import Command from 'common-bin';
import fs from 'fs';
import env2 from 'env2';
import path from 'path';
import updateNotifier from 'update-notifier';

import GenerateCommand from './command/generate';
import UploadCommand from './command/upload';
import CheckCommand from './command/check';
import * as filter from './utils/filter';
import { errorHandler } from './utils/error-helper';
import { CATEGORIES } from './utils/constant';

// Global proxy
bootstrap();

const envPath = path.resolve(process.cwd(), './.env');

export class SurgioCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv);

    if (fs.existsSync(envPath)) {
      env2(envPath);
    }

    updateNotifier({ pkg: require('../package.json') }).notify();

    this.usage = '使用方法: surgio <command> [options]';
    this.load(path.join(__dirname, './command'));
    this.yargs.alias('v', 'version');
  }

  public errorHandler(err): void {
    errorHandler.call(this, err);
  }
}

export {
  GenerateCommand,
  UploadCommand,
  CheckCommand,
};

export const utils = {
  ...filter,
};

export const categories = {
  ...CATEGORIES,
};
