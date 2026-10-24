import { normalizeCommonConfig } from '../config-normalize.js'
import { SurgioConfigValidator } from '../validators/index.js'

import { assertWorkerConfig } from './config.js'

import type { CommandConfigBeforeNormalize } from '../types.js'
import type { WorkerRuntimeConfig } from './types.js'

export const normalizeWorkerConfig = (
  input: CommandConfigBeforeNormalize,
): WorkerRuntimeConfig => {
  assertWorkerConfig(input)
  const result = SurgioConfigValidator.safeParse(input)
  if (!result.success) {
    throw result.error
  }

  return normalizeCommonConfig(result.data) as WorkerRuntimeConfig
}
