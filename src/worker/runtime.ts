import YAML from 'yaml'

import { CACHE_KEYS } from '../constant/index.js'
import { createProvider } from '../provider/create-provider.js'
import {
  createArtifactRenderContext,
  mapConcurrent,
  mergeObjects,
  prepareProvider,
} from '../runtime/artifact.js'
import { createDefaultDomainResolver } from '../runtime/dns.js'
import { createHttpClient } from '../runtime/http-client.js'
import { consoleRuntimeLogger, withRuntimeLogger } from '../runtime/logger.js'
import { addProxyToRuleSet } from '../runtime/ruleset.js'
import { renderRestrictedSnippet } from '../runtime/snippet-interpreter.js'
import { addFlagMap } from '../utils/flag.js'
import { getClashNodes } from '../utils/clash.js'
import { getLoonNodes } from '../utils/loon.js'
import {
  getShadowsocksNodes,
  getShadowsocksNodesJSON,
  getShadowsocksrNodes,
  getV2rayNNodes,
  toMD5,
} from '../utils/portable.js'
import { getQuantumultXNodes } from '../utils/quantumult.js'
import { getSingboxEndpoints, getSingboxNodes } from '../utils/singbox.js'
import { getSurfboardNodes } from '../utils/surfboard.js'
import { getSurgeNodes } from '../utils/surge.js'
import { ArtifactValidator } from '../validators/index.js'

import { normalizeWorkerConfig } from './normalize-config.js'
import { createPrecompiledRenderer } from './template-engine.js'

import type {
  ArtifactConfig,
  NodeFilterType,
  PossibleNodeConfigType,
  RemoteSnippet,
  SortedNodeFilterType,
  SubscriptionUserinfo,
} from '../types.js'
import type { ProviderRuntimeContext } from '../runtime/types.js'
import type {
  GetNodeListParams,
  PossibleProviderType,
} from '../provider/types.js'
import type {
  RenderArtifactOptions,
  RenderProvidersOptions,
  SurgioRuntime,
  WorkerManifest,
  WorkerProviderFormat,
  WorkerRenderResult,
  WorkerRuntimeOptions,
} from './types.js'

interface RenderData {
  readonly body: string
  readonly subscriptionUserInfo?: SubscriptionUserinfo
  readonly subscriptionUserInfoMap: Readonly<
    Record<string, SubscriptionUserinfo>
  >
}

const formatProviders = (
  format: WorkerProviderFormat,
  nodeList: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
): string => {
  const callFormatter = <T>(formatter: (...args: any[]) => T): T =>
    filter === undefined ? formatter(nodeList) : formatter(nodeList, filter)

  switch (format) {
    case 'clash':
    case 'clash-provider':
      return YAML.stringify({ proxies: callFormatter(getClashNodes) })
    case 'singbox':
      return JSON.stringify(
        {
          outbounds: callFormatter(getSingboxNodes),
          endpoints: callFormatter(getSingboxEndpoints),
        },
        null,
        2,
      )
    case 'surge':
      return callFormatter(getSurgeNodes)
    case 'surfboard':
      return callFormatter(getSurfboardNodes)
    case 'quantumultx':
      return callFormatter(getQuantumultXNodes)
    case 'loon':
      return callFormatter(getLoonNodes)
    case 'shadowsocks':
      return callFormatter(getShadowsocksNodes)
    case 'shadowsocks-json':
      return callFormatter(getShadowsocksNodesJSON)
    case 'shadowsocksr':
      return callFormatter(getShadowsocksrNodes)
    case 'v2rayn':
      return callFormatter(getV2rayNNodes)
  }
}

export const createSurgioRuntime = (
  manifest: WorkerManifest,
  options: WorkerRuntimeOptions,
): SurgioRuntime => {
  if (!options?.cache) throw new Error('Worker runtime 必须注入 cache')

  const config = normalizeWorkerConfig(manifest.config)
  const logger = options.logger ?? consoleRuntimeLogger
  const network = options.network ?? {}
  const concurrency = network.concurrency ?? 5
  const resolveDomain = options.resolveDomain ?? createDefaultDomainResolver()
  for (const [emoji, names] of Object.entries(config.flags ?? {})) {
    for (const name of Array.isArray(names) ? names : [names]) {
      addFlagMap(name, emoji)
    }
  }
  const providerRuntime: ProviderRuntimeContext = {
    cache: options.cache,
    config,
    httpClient: createHttpClient({
      fetch: options.fetch,
      retry: network.retry ?? 1,
      timeout: network.timeout ?? 10_000,
    }),
    logger,
    providerCacheTtl: network.providerCacheTtl ?? 10 * 60_000,
    version: manifest.surgioVersion,
  }
  const renderer = createPrecompiledRenderer(manifest, {
    clashCore: config.clashConfig?.clashCore,
  })

  const getArtifact = (name: string): ArtifactConfig => {
    const artifact = config.artifacts.find((item) => item.name === name)
    if (!artifact) throw new Error(`Artifact ${name} 不存在`)
    return artifact
  }

  const getProvider = async (name: string): Promise<PossibleProviderType> => {
    const definition = manifest.providers[name]
    if (!definition) throw new Error(`Provider ${name} 未注册`)
    return createProvider(name, definition, providerRuntime)
  }

  const loadRemoteSnippets = async (): Promise<ReadonlyArray<RemoteSnippet>> =>
    mapConcurrent(
      config.remoteSnippets ?? [],
      concurrency,
      async (snippetConfig) => {
        const cacheKey = `${CACHE_KEYS.RemoteSnippets}:${toMD5(snippetConfig.url)}`
        const text = await options.cache.wrap(
          cacheKey,
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

  const render = async (
    artifact: ArtifactConfig,
    renderOptions: RenderArtifactOptions = {},
  ): Promise<WorkerRenderResult> => {
    const cacheKey = `${CACHE_KEYS.RenderedArtifact}:worker:${toMD5(
      JSON.stringify([artifact.name, renderOptions]),
    )}`
    const data = await options.cache.wrap<RenderData>(
      cacheKey,
      async () => {
        const providerNames = [
          artifact.provider,
          ...(artifact.combineProviders ?? []),
        ]
        const customParams = mergeObjects(
          config.customParams,
          artifact.customParams,
          renderOptions.customParams,
          renderOptions.getNodeListParams,
        )
        const providerResults = await mapConcurrent(
          providerNames,
          concurrency,
          async (providerName) =>
            prepareProvider({
              provider: await getProvider(providerName),
              providerName,
              params: customParams as GetNodeListParams,
              config,
              concurrency,
              resolveDomain: (domain) => resolveDomain(domain, network.timeout),
              logger,
              providerRuntime,
            }),
        )
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
        const subscriptionProvider =
          artifact.subscriptionUserInfoProvider ?? artifact.provider
        const subscriptionUserInfo =
          subscriptionUserInfoMap[subscriptionProvider]
        const remoteSnippetList = await loadRemoteSnippets()
        const renderContext = createArtifactRenderContext({
          artifact,
          config,
          nodeList,
          mainProvider,
          customFilters,
          customParams,
          remoteSnippetList,
          downloadUrl: renderOptions.downloadUrl,
          loadSnippet: (name: string): RemoteSnippet => {
            const text = manifest.rawTemplates[name]
            if (text === undefined) throw new Error(`本地片段 ${name} 不存在`)
            return {
              name,
              url: name,
              text,
              main: (rule: string) => addProxyToRuleSet(text, rule),
            }
          },
        })
        const selectedFilter = renderOptions.filter
          ? customFilters[renderOptions.filter]
          : undefined
        if (renderOptions.filter && !selectedFilter) {
          throw new Error(`Filter ${renderOptions.filter} 不存在`)
        }

        let body: string
        if (renderOptions.format) {
          body = withRuntimeLogger(logger, () =>
            formatProviders(
              renderOptions.format!,
              nodeList,
              selectedFilter as
                NodeFilterType | SortedNodeFilterType | undefined,
            ),
          )
        } else {
          body = withRuntimeLogger(logger, () =>
            renderer.renderArtifact(artifact, renderContext),
          )
        }
        return { body, subscriptionUserInfo, subscriptionUserInfoMap }
      },
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
      return withRuntimeLogger(logger, () =>
        renderer.renderTemplate(
          name.endsWith('.tpl') ? name : `${name}.tpl`,
          context,
        ),
      )
    },
    listArtifacts() {
      return [...config.artifacts]
    },
    listProviders() {
      return Object.keys(manifest.providers)
    },
    async getProviderSubscription(name, params = {}) {
      const provider = await getProvider(name)
      return provider.getSubscriptionUserInfo(params as GetNodeListParams)
    },
    close() {
      return options.cache.close()
    },
  }
}
