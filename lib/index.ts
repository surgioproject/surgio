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
  isAWS,
  isAWSLambda,
  isFlyIO,
  isGFWFree,
  isGitHubActions,
  isGitLabCI,
  isHeroku,
  isNetlify,
  isNow,
  isRailway,
  isVercel,
} from './utils';
import { defineGlobalOptions } from './utils/command';
import * as filter from './utils/filter';
import * as caches from './utils/cache';
import { errorHandler } from './utils/error-helper';
import { CATEGORIES } from './constant';
import redis from './redis';

// istanbul ignore next
if (!isGFWFree()) {
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

    defineGlobalOptions(this.yargs);

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
  isVercel,
  isGitHubActions,
  isGitLabCI,
  isRailway,
  isNetlify,
  isAWS,
  isFlyIO,
  isAWSLambda,
};

export const categories = {
  ...CATEGORIES,
};

export { pkg, caches, redis };
