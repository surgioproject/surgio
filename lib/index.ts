import 'source-map-support/register';
import './utils/patch-proxy';

import { bootstrap } from 'global-agent';
import Command from 'common-bin';
import fs from 'fs-extra';
import env2 from 'env2';
import { resolve, join } from 'path';
import { PackageJson } from 'type-fest';
import updateNotifier from 'update-notifier';
import { transports } from '@surgio/logger';

import {
  isGitHubActions,
  isGitLabCI,
  isHeroku,
  isNow,
  isRailway,
} from './utils';
import * as filter from './utils/filter';
import { errorHandler } from './utils/error-helper';
import { CATEGORIES } from './constant';

// istanbul ignore next
if (
  !isNow() &&
  !isHeroku() &&
  !isGitHubActions() &&
  !isGitLabCI() &&
  !isRailway()
) {
  // Global proxy
  bootstrap();
}

const envPath = resolve(process.cwd(), './.env');
const pkg = fs.readJSONSync(join(__dirname, '../package.json')) as PackageJson;

export class SurgioCommand extends Command {
  constructor(rawArgv?: string[]) {
    super(rawArgv);

    // istanbul ignore next
    if (fs.existsSync(envPath)) {
      env2(envPath);
    }

    updateNotifier({ pkg: require('../package.json') }).notify();

    this.usage = '使用方法: surgio <command> [options]';

    this.load(join(__dirname, './command'));

    this.options = {
      V: {
        alias: 'verbose',
        demandOption: false,
        describe: '打印调试日志',
        type: 'boolean',
      },
    };
    // 禁用 yargs 内部生成的 help 信息，似乎和 common-bin 的 load 有冲突
    this.yargs.help(false);

    // istanbul ignore next
    if (this.yargs.argv.verbose) {
      transports.console.level = 'debug';
    }
  }

  public errorHandler(err): void {
    errorHandler.call(this, err);
  }
}

export const utils = {
  ...filter,
  isHeroku,
  isNow,
  isGitHubActions,
  isGitLabCI,
};

export const categories = {
  ...CATEGORIES,
};

export { pkg };
