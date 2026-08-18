import { CATEGORIES } from '../constant/index.js'
import * as filterExports from '../filters/index.js'
import * as useragentUtils from '../utils/useragent.js'

export { NodeTypeEnum } from '../types.js'

export {
  combineExtendFunctions,
  createExtendFunction,
  extendEndpoints,
  extendOutbounds,
} from '../generator/json-extend.js'
export {
  defineClashProvider,
  defineCustomProvider,
  defineShadowsocksJsonSubscribeProvider,
  defineShadowsocksrSubscribeProvider,
  defineShadowsocksSubscribeProvider,
  defineSsdProvider,
  defineTrojanProvider,
  defineV2rayNSubscribeProvider,
} from '../configurables.js'

const { internalFilters, ...filterUtils } = filterExports

export const utils = {
  ...internalFilters,
  ...filterUtils,
  ...useragentUtils,
} as const

export const categories = CATEGORIES

export type { JsonObject } from 'type-fest'
export type { ExtendContext } from '../generator/json-extend.js'
export type { GetNodeListParams } from '../provider/types.js'
export type {
  ArtifactConfigInput,
  PossibleNodeConfigInputType,
} from '../types.js'
