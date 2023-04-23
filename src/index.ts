import { PackageJson } from 'type-fest'

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
} from './utils'
import * as filter from './utils/filter'
import { CATEGORIES } from './constant'

export type { CommandConfigBeforeNormalize as SurgioConfig } from './types'
export * as caches from './utils/cache'
export * from './utils/configurables'

const pkg = require('../package.json') as PackageJson

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
}

export const categories = {
  ...CATEGORIES,
}

export { pkg }
