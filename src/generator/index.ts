export * from './artifact.js'
export * from './template.js'
export type { Renderer, RenderContext } from '../runtime/renderer.js'
export {
  extendOutbounds,
  extendEndpoints,
  createExtendFunction,
  combineExtendFunctions,
} from './json-extend.js'
