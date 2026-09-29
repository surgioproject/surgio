import path from 'node:path'
import fs from 'fs-extra'

import packageJson from '../../package.json' with { type: 'json' }
import { unifiedCache } from '../cache/singleton.js'
import { createNodeRenderer, loadLocalSnippet } from '../generator/template.js'
import { resolveDomain } from '../utils/dns.js'
import { loadModuleSync } from '../utils/module-loader.js'
import {
  getNetworkConcurrency,
  getRemoteSnippetCacheMaxage,
  getRenderedArtifactCacheMaxage,
} from '../utils/env-flag.js'

import { createRuntimeCore } from './core.js'

import type { ProjectProviderDefinition } from '../project/types.js'
import type { LoadedSurgioProject } from '../project/node.js'
import type { TtlCache } from '../cache/core.js'
import type { RuntimeOptions, SurgioRuntime } from './public.js'

export interface NodeRuntimeOptions extends Omit<
  RuntimeOptions,
  'cache' | 'resolveDomain'
> {
  readonly cache?: TtlCache
  readonly resolveDomain?: RuntimeOptions['resolveDomain']
}

export const createNodeSurgioRuntime = (
  project: LoadedSurgioProject,
  options: NodeRuntimeOptions = {},
): SurgioRuntime => {
  const config = project.config

  const getProviderDefinition = (
    name: string,
  ): ProjectProviderDefinition | undefined => {
    const registered = project.providers?.[name]
    if (registered) return registered
    const filename = path.join(config.providerDir, `${name}.js`)
    if (!fs.existsSync(filename)) return undefined
    return loadModuleSync<ProjectProviderDefinition>(filename)
  }

  const listProviders = (): ReadonlyArray<string> => {
    if (project.providers) return Object.keys(project.providers)
    if (!fs.existsSync(config.providerDir)) return []
    return fs
      .readdirSync(config.providerDir)
      .filter((name) => name.endsWith('.js'))
      .map((name) => path.basename(name, '.js'))
  }

  return createRuntimeCore(
    {
      config,
      version: packageJson.version,
      renderer: createNodeRenderer(config.templateDir, {
        artifacts: config.artifacts,
        clashCore: config.clashConfig?.clashCore,
      }),
      cacheScope: 'node-runtime',
      listProviders,
      getProviderDefinition,
      loadSnippet: (name) => loadLocalSnippet(config.templateDir, name),
    },
    {
      ...options,
      cache: options.cache ?? unifiedCache,
      resolveDomain: options.resolveDomain ?? resolveDomain,
      network: {
        concurrency: getNetworkConcurrency(),
        artifactCacheTtl: getRenderedArtifactCacheMaxage(),
        remoteSnippetCacheTtl: getRemoteSnippetCacheMaxage(),
        ...options.network,
      },
    },
  )
}
