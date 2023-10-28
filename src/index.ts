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
import * as useragentUtils from './utils/useragent'
import * as filters from './filters'
import { CATEGORIES } from './constant'

export type { CommandConfigBeforeNormalize as SurgioConfig } from './types'
export * from './configurables'
export { default as httpClient } from './utils/http-client'
export { unifiedCache as cache } from './utils/cache'

const { internalFilters, ...filtersUtils } = filters

export const utils = {
  ...internalFilters,
  ...filtersUtils,
  ...useragentUtils,
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
