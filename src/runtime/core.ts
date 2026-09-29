import { logger as defaultLogger } from '@surgio/logger'

import { CACHE_KEYS } from '../constant/index.js'
import { createProvider } from '../provider/create-provider.js'
import { isError, isSurgioError, SurgioError } from '../utils/errors.js'
import { toMD5 } from '../utils/portable.js'
import { ArtifactValidator } from '../validators/index.js'

import {
  createArtifactRenderContext,
  mapConcurrent,
  mergeObjects,
  prepareProvider,
} from './artifact.js'
import { buildRenderedArtifactCacheKey } from './cache-key.js'
import { createDefaultDomainResolver } from './dns.js'
import { formatProviderNodes } from './format.js'
import { createHttpClient } from './http-client.js'
import { addProxyToRuleSet } from './ruleset.js'
import { renderRestrictedSnippet } from './snippet-interpreter.js'

import type { ProjectProviderDefinition } from '../project/types.js'
import type {
  GetNodeListParams,
  PossibleProviderType,
} from '../provider/types.js'
import type {
  ArtifactConfig,
  CommandConfigAfterNormalize,
  NodeFilterType,
  RemoteSnippet,
  SortedNodeFilterType,
  SubscriptionUserinfo,
} from '../types.js'
import type { CacheKeyScope } from './cache-key.js'
import type {
  RenderArtifactOptions,
  RenderProvidersOptions,
  RuntimeOptions,
  RuntimeRenderResult,
  SurgioRuntime,
} from './public.js'
import type { Renderer } from './renderer.js'
import type { PreparedProvider } from './artifact.js'
import type { ProviderRuntimeContext } from './types.js'

export type RuntimeConfig = CommandConfigAfterNormalize & {
  readonly publicUrl: string
  readonly urlBase: string
}

/** 平台 adapter 只需提供配置来源、Provider 查找、本地片段和渲染器。 */
export interface RuntimePlatform {
  readonly config: RuntimeConfig
  readonly version: string
  readonly renderer: Renderer
  readonly cacheScope: CacheKeyScope
  listProviders(): ReadonlyArray<string>
  getProviderDefinition(name: string): ProjectProviderDefinition | undefined
  loadSnippet(name: string): RemoteSnippet
}

interface RenderData {
  readonly body: string
  readonly subscriptionUserInfo?: SubscriptionUserinfo
  readonly subscriptionUserInfoMap: Readonly<
    Record<string, SubscriptionUserinfo>
  >
}

const withProviderError = async <T>(
  providerName: string,
  task: () => Promise<T>,
): Promise<T> => {
  try {
    return await task()
  } catch (error) {
    if (isSurgioError(error)) {
      error.providerName ??= providerName
      throw error
    }
    throw new SurgioError(
      isError(error) ? error.message : '处理 Provider 失败',
      {
        cause: error,
        providerName,
      },
    )
  }
}

export const createRuntimeCore = (
  platform: RuntimePlatform,
  options: RuntimeOptions,
): SurgioRuntime => {
  const { config, renderer } = platform
  const { cache } = options
  const logger = options.logger ?? defaultLogger
  const network = options.network ?? {}
  const concurrency = network.concurrency ?? 5
  const resolveDomain = options.resolveDomain ?? createDefaultDomainResolver()
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
    version: platform.version,
  }

  const getArtifact = (name: string): ArtifactConfig => {
    const artifact = config.artifacts.find((item) => item.name === name)
    if (!artifact) throw new Error(`Artifact ${name} 不存在`)
    return artifact
  }

  const getProvider = async (
    name: string,
  ): Promise<PossibleProviderType | undefined> => {
    const definition = platform.getProviderDefinition(name)
    return definition
      ? createProvider(name, definition, providerRuntime)
      : undefined
  }

  const requireProvider = async (
    name: string,
  ): Promise<PossibleProviderType> => {
    const provider = await getProvider(name)
    if (!provider) throw new Error(`Provider ${name} 不存在`)
    return provider
  }

  const loadProviders = (
    artifact: ArtifactConfig,
    renderOptions: RenderArtifactOptions,
  ): Promise<PreparedProvider[]> =>
    mapConcurrent(
      [artifact.provider, ...(artifact.combineProviders ?? [])],
      concurrency,
      (providerName) =>
        withProviderError(providerName, async () =>
          prepareProvider({
            provider: await requireProvider(providerName),
            providerName,
            params: mergeObjects(
              config.customParams,
              artifact.customParams,
              renderOptions.getNodeListParams,
            ) as GetNodeListParams,
            config,
            concurrency,
            resolveDomain: (domain) => resolveDomain(domain, network.timeout),
            logger,
            providerRuntime,
          }),
        ),
    )

  const loadRemoteSnippets = (): Promise<ReadonlyArray<RemoteSnippet>> =>
    mapConcurrent(
      config.remoteSnippets ?? [],
      concurrency,
      async (snippetConfig) => {
        const text = await cache.wrap(
          `${CACHE_KEYS.RemoteSnippets}:${toMD5(snippetConfig.url)}`,
          async () => {
            const response = await providerRuntime.httpClient.get(
              snippetConfig.url,
            )
            logger.info('远程片段下载成功：%s', snippetConfig.url)
            return response.body
          },
          network.remoteSnippetCacheTtl ?? 12 * 60 * 60_000,
        )
        return {
          name: snippetConfig.name,
          url: snippetConfig.url,
          text,
          main: (...args: string[]) =>
            snippetConfig.surgioSnippet
              ? renderRestrictedSnippet(text, args)
              : addProxyToRuleSet(text, args[0]),
        }
      },
    )

  const renderFresh = async (
    artifact: ArtifactConfig,
    renderOptions: RenderArtifactOptions,
  ): Promise<RenderData> => {
    const providerResults = await loadProviders(artifact, renderOptions)
    const nodeList = providerResults.flatMap((result) => result.nodeList)
    const mainProvider = providerResults.find(
      (result) => result.provider.name === artifact.provider,
    )!.provider
    const customFilters = {
      ...config.customFilters,
      ...mainProvider.config.customFilters,
      ...artifact.customFilters,
    }
    const subscriptionUserInfoMap = Object.fromEntries(
      providerResults.flatMap((result) =>
        result.subscriptionUserInfo
          ? [[result.provider.name, result.subscriptionUserInfo] as const]
          : [],
      ),
    )
    const subscriptionUserInfo =
      subscriptionUserInfoMap[
        artifact.subscriptionUserInfoProvider ?? artifact.provider
      ]
    const selectedFilter =
      typeof renderOptions.filter === 'string'
        ? customFilters[renderOptions.filter]
        : renderOptions.filter
    if (typeof renderOptions.filter === 'string' && !selectedFilter) {
      throw new Error(`Filter ${renderOptions.filter} 不存在`)
    }

    if (renderOptions.format) {
      const body = formatProviderNodes(
        renderOptions.format,
        nodeList,
        selectedFilter as NodeFilterType | SortedNodeFilterType | undefined,
        { logger },
      )
      return { body, subscriptionUserInfo, subscriptionUserInfoMap }
    }

    const renderContext = createArtifactRenderContext({
      artifact,
      config,
      nodeList,
      mainProvider,
      customFilters,
      customParams: mergeObjects(
        config.customParams,
        artifact.customParams,
        renderOptions.customParams,
      ),
      remoteSnippetList: await loadRemoteSnippets(),
      downloadUrl: renderOptions.downloadUrl,
      loadSnippet: platform.loadSnippet,
      logger,
    })
    const body = renderer.renderArtifact(artifact, renderContext)
    return { body, subscriptionUserInfo, subscriptionUserInfoMap }
  }

  const render = async (
    artifact: ArtifactConfig,
    renderOptions: RenderArtifactOptions = {},
  ): Promise<RuntimeRenderResult> => {
    const cacheKey = buildRenderedArtifactCacheKey(
      platform.cacheScope,
      artifact,
      renderOptions,
    )
    if (!cacheKey.cacheable) {
      logger.debug(
        'Artifact %s 跳过渲染缓存：%s',
        artifact.name,
        cacheKey.reason,
      )
      return { ...(await renderFresh(artifact, renderOptions)), artifact }
    }

    const data = await cache.wrap<RenderData>(
      cacheKey.key,
      () => renderFresh(artifact, renderOptions),
      network.artifactCacheTtl ?? 7 * 24 * 60 * 60_000,
    )
    return { ...data, artifact }
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
      return platform.listProviders()
    },
    async getProviderInfo(name) {
      const provider = await getProvider(name)
      if (!provider) return undefined
      return {
        name: provider.name,
        type: provider.type,
        ...('url' in provider && typeof provider.url === 'string'
          ? { url: provider.url }
          : null),
        supportGetSubscriptionUserInfo: provider.supportGetSubscriptionUserInfo,
      }
    },
    async getProviderSubscription(name, params = {}) {
      const provider = await requireProvider(name)
      return provider.getSubscriptionUserInfo(params as GetNodeListParams)
    },
    getGatewayConfig() {
      return {
        urlBase: config.urlBase,
        publicUrl: config.publicUrl,
        coreVersion: platform.version,
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
