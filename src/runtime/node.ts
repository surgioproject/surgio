import path from 'node:path'
import fs from 'fs-extra'
import { logger as nodeLogger } from '@surgio/logger'

import packageJson from '../../package.json' with { type: 'json' }
import { unifiedCache } from '../cache/singleton.js'
import { CACHE_KEYS } from '../constant/index.js'
import { Artifact, createNodeRenderer } from '../generator/index.js'
import { createProvider } from '../provider/create-provider.js'
import { ArtifactValidator } from '../validators/index.js'
import { loadRemoteSnippetList } from '../utils/remote-snippet.js'
import { loadModuleSync } from '../utils/module-loader.js'
import { toMD5 } from '../utils/portable.js'

import { createHttpClient } from './http-client.js'
import { formatProviderNodes } from './format.js'

import type { ProjectProviderDefinition } from '../project/types.js'
import type { LoadedSurgioProject } from '../project/node.js'
import type { PossibleProviderType } from '../provider/types.js'
import type { TtlCache } from '../cache/core.js'
import type {
  ArtifactConfig,
  NodeFilterType,
  SortedNodeFilterType,
  SubscriptionUserinfo,
} from '../types.js'
import type {
  RenderArtifactOptions,
  RenderProvidersOptions,
  RuntimeOptions,
  RuntimeRenderResult,
  SurgioRuntime,
} from './public.js'
import type { ProviderRuntimeContext } from './types.js'

export interface NodeRuntimeOptions extends Omit<
  RuntimeOptions,
  'cache' | 'resolveDomain'
> {
  readonly cache?: TtlCache
  readonly resolveDomain?: RuntimeOptions['resolveDomain']
}

interface RenderData {
  readonly body: string
  readonly subscriptionUserInfo?: SubscriptionUserinfo
  readonly subscriptionUserInfoMap: Readonly<
    Record<string, SubscriptionUserinfo>
  >
}

export const createNodeSurgioRuntime = (
  project: LoadedSurgioProject,
  options: NodeRuntimeOptions = {},
): SurgioRuntime => {
  const config = project.config
  const cache = options.cache ?? unifiedCache
  const logger = options.logger ?? nodeLogger
  const network = options.network ?? {}
  const providerRuntime: ProviderRuntimeContext = {
    cache,
    config,
    httpClient: createHttpClient({
      fetch: options.fetch,
      retry: network.retry ?? 1,
      timeout: network.timeout ?? 10_000,
    }),
    logger,
    providerCacheTtl: network.providerCacheTtl ?? 10 * 60_000,
    version: packageJson.version,
  }
  const renderer = createNodeRenderer(config.templateDir, {
    artifacts: config.artifacts,
    clashCore: config.clashConfig?.clashCore,
  })

  const getArtifact = (name: string): ArtifactConfig => {
    const artifact = config.artifacts.find((item) => item.name === name)
    if (!artifact) throw new Error(`Artifact ${name} 不存在`)
    return artifact
  }

  const getProviderDefinition = (
    name: string,
  ): ProjectProviderDefinition | undefined => {
    const registered = project.providers?.[name]
    if (registered) return registered
    const filename = path.join(config.providerDir, `${name}.js`)
    if (!fs.existsSync(filename)) return undefined
    return loadModuleSync<ProjectProviderDefinition>(filename)
  }

  const getProvider = async (
    name: string,
  ): Promise<PossibleProviderType | undefined> => {
    const definition = getProviderDefinition(name)
    return definition
      ? createProvider(name, definition, providerRuntime)
      : undefined
  }

  const render = async (
    artifactConfig: ArtifactConfig,
    renderOptions: RenderArtifactOptions = {},
  ): Promise<RuntimeRenderResult> => {
    const cacheKey = `${CACHE_KEYS.RenderedArtifact}:node-runtime:${toMD5(
      JSON.stringify([artifactConfig.name, renderOptions]),
    )}`
    const data = await cache.wrap<RenderData>(
      cacheKey,
      async () => {
        const snippets = await loadRemoteSnippetList(
          config.remoteSnippets ?? [],
          true,
          {
            cache,
            cacheTtl: network.remoteSnippetCacheTtl,
            concurrency: network.concurrency,
            httpClient: providerRuntime.httpClient,
            logger,
          },
        )
        const artifact = new Artifact(
          config,
          {
            ...artifactConfig,
            ...(renderOptions.downloadUrl
              ? { downloadUrl: renderOptions.downloadUrl }
              : null),
          },
          {
            logger,
            providers: project.providers,
            providerRuntime,
            remoteSnippetList: snippets,
            renderer,
          },
        )
        await artifact.init({
          getNodeListParams: renderOptions.getNodeListParams,
        })
        const mainProvider = artifact.providerMap.get(
          artifact.artifact.provider,
        )
        if (!mainProvider) throw new Error('Artifact 主 Provider 未初始化')
        const filters = {
          ...config.customFilters,
          ...mainProvider.config.customFilters,
          ...artifact.artifact.customFilters,
        }
        const selectedFilter =
          typeof renderOptions.filter === 'string'
            ? filters[renderOptions.filter]
            : renderOptions.filter
        if (typeof renderOptions.filter === 'string' && !selectedFilter) {
          throw new Error(`Filter ${renderOptions.filter} 不存在`)
        }
        const body = renderOptions.format
          ? formatProviderNodes(
              renderOptions.format,
              artifact.nodeList,
              selectedFilter as
                NodeFilterType | SortedNodeFilterType | undefined,
              { logger },
            )
          : artifact.render(renderOptions.customParams as Record<string, any>)
        return {
          body,
          subscriptionUserInfo: artifact.subscriptionUserInfo,
          subscriptionUserInfoMap: Object.fromEntries(
            artifact.subscriptionUserInfoMap,
          ),
        }
      },
      network.artifactCacheTtl ?? 7 * 24 * 60 * 60_000,
    )
    return { ...data, artifact: artifactConfig }
  }

  return {
    renderArtifact(name, renderOptions) {
      return render(getArtifact(name), renderOptions)
    },
    renderProviders(renderOptions: RenderProvidersOptions) {
      const providers = Array.isArray(renderOptions.providers)
        ? renderOptions.providers
        : [renderOptions.providers]
      if (!providers.length) throw new Error('至少需要一个 Provider')
      const artifact = ArtifactValidator.parse({
        name: `providers:${providers.join(',')}`,
        provider: providers[0],
        combineProviders: providers.slice(1),
        template: renderOptions.template ?? '',
      })
      return render(artifact, {
        ...renderOptions,
        format: renderOptions.template
          ? renderOptions.format
          : (renderOptions.format ?? 'clash'),
      })
    },
    async renderTemplate(name, context = {}) {
      return renderer.renderTemplate(
        name.endsWith('.tpl') ? name : `${name}.tpl`,
        context,
      )
    },
    listArtifacts() {
      return [...config.artifacts]
    },
    listProviders() {
      if (project.providers) return Object.keys(project.providers)
      if (!fs.existsSync(config.providerDir)) return []
      return fs
        .readdirSync(config.providerDir)
        .filter((name) => name.endsWith('.js'))
        .map((name) => path.basename(name, '.js'))
    },
    async getProviderInfo(name) {
      const provider = await getProvider(name)
      if (!provider) return undefined
      return {
        name: provider.name,
        type: provider.type,
        ...('url' in provider.config && typeof provider.config.url === 'string'
          ? { url: provider.config.url }
          : null),
        supportGetSubscriptionUserInfo: provider.supportGetSubscriptionUserInfo,
      }
    },
    async getProviderSubscription(name, params = {}) {
      const provider = await getProvider(name)
      if (!provider) throw new Error(`Provider ${name} 不存在`)
      return provider.getSubscriptionUserInfo(params)
    },
    getGatewayConfig() {
      return {
        urlBase: config.urlBase,
        publicUrl: config.publicUrl,
        coreVersion: packageJson.version,
        ...config.gateway,
      }
    },
    resetCache() {
      return cache.reset()
    },
    close() {
      return cache.close()
    },
  }
}
