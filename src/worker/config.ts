import {
  defineClashProvider,
  defineCustomProvider,
  defineShadowsocksJsonSubscribeProvider,
  defineShadowsocksrSubscribeProvider,
  defineShadowsocksSubscribeProvider,
  defineSsdProvider,
  defineTrojanProvider,
  defineV2rayNSubscribeProvider,
} from '../configurables.js'

import type { WorkerProjectDefinition } from './types.js'
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

export const defineWorkerProject = <T extends WorkerProjectDefinition>(
  project: T,
): T => {
  if (!project || typeof project !== 'object') {
    throw new TypeError('Worker project 必须是对象')
  }
  if (!project.config || !project.providers) {
    throw new Error('Worker project 必须提供 config 和 providers')
  }
  assertWorkerConfig(project.config)
  return project
}

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
