import Command from 'common-bin';
import fs from 'fs';
import env2 from 'env2';
import path from 'path';
import updateNotifier from 'update-notifier';

import GenerateCommand from './command/generate';
import SpeedCommand from './command/speed';
import UploadCommand from './command/upload';
import * as filter from './utils/filter';
import { errorHandler } from './utils/error-helper';

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
  SpeedCommand,
};

export const utils = {
  ...filter,
};
