import fs from 'fs-extra';
import { join } from 'path';
import { PackageJson } from 'type-fest';

import {
  isAWS,
  isAWSLambda,
  isFlyIO,
  isGitHubActions,
  isGitLabCI,
  isHeroku,
  isNetlify,
  isNow,
  isRailway,
  isVercel,
} from './utils';
import * as filter from './utils/filter';
import * as caches from './utils/cache';
import { CATEGORIES } from './constant';
import redis from './redis';

const pkg = fs.readJSONSync(join(__dirname, '../package.json')) as PackageJson;

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
