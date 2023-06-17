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
export * from './configurables'
export { default as httpClient } from './utils/http-client'
export { unifiedCache as cache } from './utils/cache'

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
} as const

export const categories = CATEGORIES
