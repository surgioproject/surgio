import { createRuntimeCore } from '../runtime/core.js'
import { addProxyToRuleSet } from '../runtime/ruleset.js'
import { addFlagMap } from '../utils/flag.js'

import { normalizeWorkerConfig } from './normalize-config.js'
import { createPrecompiledRenderer } from './template-engine.js'

import type { CommandConfigBeforeNormalize } from '../types.js'
import type {
  SurgioRuntime,
  WorkerManifest,
  WorkerRuntimeOptions,
} from './types.js'

export const createSurgioRuntime = (
  manifest: WorkerManifest,
  options: WorkerRuntimeOptions,
): SurgioRuntime => {
  if (!options?.cache) throw new Error('Worker runtime 必须注入 cache')

  const config = normalizeWorkerConfig(
    manifest.config as CommandConfigBeforeNormalize,
  )
  for (const [emoji, names] of Object.entries(config.flags ?? {})) {
    for (const name of Array.isArray(names) ? names : [names]) {
      addFlagMap(name, emoji)
    }
  }

  return createRuntimeCore(
    {
      config,
      version: manifest.surgioVersion,
      renderer: createPrecompiledRenderer(manifest, {
        clashCore: config.clashConfig?.clashCore,
      }),
      cacheScope: 'worker',
      listProviders: () => Object.keys(manifest.providers),
      getProviderDefinition: (name) => manifest.providers[name],
      loadSnippet: (name) => {
        const text = manifest.rawTemplates[name]
        if (text === undefined) throw new Error(`本地片段 ${name} 不存在`)
        return {
          name,
          url: name,
          text,
          main: (rule: string) => addProxyToRuleSet(text, rule),
        }
      },
    },
    options,
  )
}
