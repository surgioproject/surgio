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
} from './utils/index.js'
import * as useragentUtils from './utils/useragent.js'
import * as filters from './filters/index.js'
import { CATEGORIES } from './constant/index.js'

export type { CommandConfigBeforeNormalize as SurgioConfig } from './types.js'
export * from './configurables.js'
export { httpClient } from './runtime/http-client.js'
export { unifiedCache as cache } from './cache/singleton.js'
export {
  extendOutbounds,
  extendEndpoints,
  createExtendFunction,
  combineExtendFunctions,
} from './generator/index.js'

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
