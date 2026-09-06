export * from './artifact.js'
export * from './template.js'
export type { Renderer, RenderContext } from '../runtime/renderer.js'
export {
  extendOutbounds,
  extendEndpoints,
  extendRoute,
  extendDns,
  extendInbounds,
  extendRuleSet,
  createExtendFunction,
  combineExtendFunctions,
} from './json-extend.js'
