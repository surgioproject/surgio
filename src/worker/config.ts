import {
  defineSurgioProject,
  defineClashProvider,
  defineCustomProvider,
  defineShadowsocksJsonSubscribeProvider,
  defineShadowsocksrSubscribeProvider,
  defineShadowsocksSubscribeProvider,
  defineSsdProvider,
  defineTrojanProvider,
  defineV2rayNSubscribeProvider,
} from '../configurables.js'

export {
  combineExtendFunctions,
  createExtendFunction,
  extendEndpoints,
  extendOutbounds,
} from '../generator/json-extend.js'

const nodeOnlyConfigFields = [
  'output',
  'providerDir',
  'configDir',
  'upload',
  'cache',
] as const

export const assertWorkerConfig = (config: object): void => {
  for (const field of nodeOnlyConfigFields) {
    if (Object.hasOwn(config, field)) {
      throw new Error(`Worker 配置不支持 Node-only 字段 ${field}`)
    }
  }
}

/** @deprecated Use defineSurgioProject from surgio/project. */
export const defineWorkerProject = defineSurgioProject

export {
  defineClashProvider,
  defineCustomProvider,
  defineShadowsocksJsonSubscribeProvider,
  defineShadowsocksrSubscribeProvider,
  defineShadowsocksSubscribeProvider,
  defineSsdProvider,
  defineTrojanProvider,
  defineV2rayNSubscribeProvider,
}

export type {
  WorkerArtifactInput,
  WorkerProjectDefinition,
  WorkerProviderDefinition,
} from './types.js'
