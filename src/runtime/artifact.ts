import { internalFilters, validateFilter } from '../filters/index.js'
import CustomProvider from '../provider/CustomProvider.js'
import { NodeTypeEnum, SupportProviderEnum } from '../types.js'
import { prependFlag, removeFlag } from '../utils/flag.js'
import { getClashNodeNames, getClashNodes } from '../utils/clash.js'
import { getLoonNodeNames, getLoonNodes } from '../utils/loon.js'
import {
  getDownloadUrl,
  getNodeNames,
  getShadowsocksNodes,
  getShadowsocksNodesJSON,
  getShadowsocksrNodes,
  getUrl,
  getV2rayNNodes,
  isIp,
  toBase64,
  toUrlSafeBase64,
} from '../utils/portable.js'
import {
  getQuantumultXNodeNames,
  getQuantumultXNodes,
} from '../utils/quantumult.js'
import {
  getSingboxEndpoints,
  getSingboxNodeNames,
  getSingboxNodes,
} from '../utils/singbox.js'
import { getSurfboardNodeNames, getSurfboardNodes } from '../utils/surfboard.js'
import {
  getSurgeNodeNames,
  getSurgeNodes,
  getSurgeTailscaleNodes,
  getSurgeWireguardNodes,
} from '../utils/surge.js'
import { SurgioError } from '../utils/errors.js'
import { MasqueNodeConfigValidator } from '../validators/index.js'

import type { Logger } from '@surgio/logger'
import type {
  ArtifactConfig,
  CommandConfigAfterNormalize,
  NodeFilterType,
  PossibleNodeConfigType,
  RemoteSnippet,
  SortedNodeFilterType,
  SubscriptionUserinfo,
} from '../types.js'
import type {
  GetNodeListParams,
  PossibleProviderType,
} from '../provider/types.js'
import type {
  FormatterOptions,
  ProviderRuntimeContext,
  RuntimeDomainResolver,
} from './types.js'

type ArtifactRuntimeConfig = CommandConfigAfterNormalize & {
  readonly publicUrl: string
  readonly urlBase: string
}

export interface PreparedProvider {
  readonly provider: PossibleProviderType
  readonly nodeList: ReadonlyArray<PossibleNodeConfigType>
  readonly subscriptionUserInfo?: SubscriptionUserinfo
}

export const mapConcurrent = async <T, U>(
  values: ReadonlyArray<T>,
  concurrency: number,
  mapper: (value: T, index: number) => Promise<U>,
): Promise<U[]> => {
  const output = new Array<U>(values.length)
  let nextIndex = 0
  const worker = async (): Promise<void> => {
    while (nextIndex < values.length) {
      const index = nextIndex++
      output[index] = await mapper(values[index], index)
    }
  }
  await Promise.all(
    Array.from(
      { length: Math.min(values.length, Math.max(1, concurrency)) },
      worker,
    ),
  )
  return output
}

export const mergeObjects = (
  ...values: ReadonlyArray<Readonly<Record<string, unknown>> | undefined>
): Record<string, unknown> => {
  const output: Record<string, unknown> = {}
  for (const value of values) {
    for (const [key, item] of Object.entries(value ?? {})) {
      output[key] =
        item && typeof item === 'object' && !Array.isArray(item)
          ? mergeObjects(
              typeof output[key] === 'object' && !Array.isArray(output[key])
                ? (output[key] as Record<string, unknown>)
                : undefined,
              item as Record<string, unknown>,
            )
          : item
    }
  }
  return output
}

export const prepareProvider = async (options: {
  readonly provider: PossibleProviderType
  readonly providerName: string
  readonly providerPath?: string
  readonly params: GetNodeListParams
  readonly config: ArtifactRuntimeConfig
  readonly concurrency: number
  readonly resolveDomain: RuntimeDomainResolver
  readonly logger: Logger
  readonly providerRuntime?: ProviderRuntimeContext
}): Promise<PreparedProvider> => {
  const {
    provider,
    providerName,
    providerPath,
    params,
    config,
    concurrency,
    resolveDomain,
    logger,
    providerRuntime,
  } = options
  let result

  try {
    result = await provider.getNodeListV2(params)
  } catch (error) {
    if (!provider.config.hooks?.onError || !(error instanceof Error))
      throw error
    const fallback = await provider.config.hooks.onError(error)
    if (!Array.isArray(fallback)) return { provider, nodeList: [] }

    const adHoc = new CustomProvider('ad-hoc', {
      type: SupportProviderEnum.Custom,
      nodeList: fallback,
    })
    if (providerRuntime) adHoc.useRuntime(providerRuntime)
    result = await adHoc.getNodeListV2(params)
  }

  let nodeList = result.nodeList
  const sortedFilter = provider.config.nodeFilter
  if (
    validateFilter(sortedFilter) &&
    typeof sortedFilter === 'object' &&
    sortedFilter.supportSort
  ) {
    nodeList = sortedFilter.filter(nodeList)
  }

  const processed = await mapConcurrent(
    nodeList,
    concurrency,
    async (node, nodeIndex) => {
      if (node.enable === false) return undefined
      const filter = provider.config.nodeFilter
      if (
        typeof filter === 'function' &&
        validateFilter(filter) &&
        !filter(node)
      ) {
        return undefined
      }

      node.provider = provider
      node.surgeConfig = Object.freeze({
        ...config.surgeConfig,
        ...node.surgeConfig,
      })
      node.clashConfig = Object.freeze({
        ...config.clashConfig,
        ...node.clashConfig,
      })
      node.quantumultXConfig = Object.freeze({
        ...config.quantumultXConfig,
        ...node.quantumultXConfig,
      })
      node.surfboardConfig = Object.freeze({
        ...config.surfboardConfig,
        ...node.surfboardConfig,
      })

      const renamed = provider.config.renameNode?.(node.nodeName)
      if (renamed) node.nodeName = renamed
      if (provider.config.addFlag) {
        node.nodeName = prependFlag(
          node.nodeName,
          provider.config.removeExistingFlag,
        )
      } else if (provider.config.removeExistingFlag) {
        node.nodeName = removeFlag(node.nodeName)
      }
      if (node.tfo === undefined && provider.config.tfo) {
        node.tfo = provider.config.tfo
      }
      if (node.mptcp === undefined && provider.config.mptcp) {
        node.mptcp = provider.config.mptcp
      }
      if (node.ecn === undefined && provider.config.ecn) {
        node.ecn = provider.config.ecn
      }
      if (node.blockQuic === undefined && provider.config.blockQuic) {
        node.blockQuic = provider.config.blockQuic
      }
      if (!node.underlyingProxy && provider.config.underlyingProxy) {
        node.underlyingProxy = provider.config.underlyingProxy
      }

      if (node.type === NodeTypeEnum.Masque) {
        const validation = MasqueNodeConfigValidator.safeParse(node)
        if (!validation.success) {
          throw new SurgioError('节点配置校验失败', {
            providerName,
            providerPath,
            nodeIndex,
            cause: validation.error,
          })
        }
      }

      if (
        (config.checkHostname || config.resolveHostname) &&
        'hostname' in node &&
        typeof node.hostname === 'string' &&
        !isIp(node.hostname)
      ) {
        try {
          const addresses = await resolveDomain(node.hostname)
          if (!addresses.length && config.checkHostname) {
            logger.warn('DNS 解析结果中 %s 未有对应 IP 地址', node.hostname)
            return undefined
          }
          if (addresses.length) {
            if (config.resolveHostname) node.hostname = addresses[0]
          }
        } catch {
          if (config.checkHostname) {
            logger.warn('%s 无法解析，将忽略该节点', node.hostname)
            return undefined
          }
          logger.warn('%s 无法解析，将忽略该域名的解析结果', node.hostname)
        }
      }

      return node
    },
  )

  return {
    provider,
    nodeList: processed.filter(
      (node): node is PossibleNodeConfigType => node !== undefined,
    ),
    subscriptionUserInfo: result.subscriptionUserInfo,
  }
}

export const createArtifactRenderContext = (options: {
  readonly artifact: ArtifactConfig
  readonly config: ArtifactRuntimeConfig
  readonly nodeList: ReadonlyArray<PossibleNodeConfigType>
  readonly mainProvider: PossibleProviderType
  readonly customFilters: Readonly<Record<string, unknown>>
  readonly customParams: Readonly<Record<string, unknown>>
  readonly remoteSnippetList?: ReadonlyArray<RemoteSnippet>
  readonly loadSnippet: (name: string) => RemoteSnippet
  readonly downloadUrl?: string
  readonly logger: Logger
}) => {
  const {
    artifact,
    config,
    nodeList,
    mainProvider,
    customFilters,
    customParams,
    remoteSnippetList = [],
    loadSnippet,
    downloadUrl,
    logger,
  } = options
  const formatterOptions = { logger }
  const bindFormatter =
    <T>(
      formatter: (
        list: ReadonlyArray<PossibleNodeConfigType>,
        filter?: NodeFilterType | SortedNodeFilterType,
        options?: FormatterOptions,
      ) => T,
    ) =>
    (
      list: ReadonlyArray<PossibleNodeConfigType>,
      filter?: NodeFilterType | SortedNodeFilterType,
    ): T =>
      formatter(list, filter, formatterOptions)
  const bindFilterAwareFormatter = <T>(
    formatter: (
      list: ReadonlyArray<PossibleNodeConfigType>,
      filter?: NodeFilterType | SortedNodeFilterType,
      options?: FormatterOptions,
    ) => T,
  ) =>
    function (
      list: ReadonlyArray<PossibleNodeConfigType>,
      filter?: NodeFilterType | SortedNodeFilterType,
    ): T {
      return arguments.length === 2 && filter === undefined
        ? formatter(list, filter)
        : formatter(list, filter, formatterOptions)
    }
  const boundGetClashNodeNames = function (
    list: ReadonlyArray<PossibleNodeConfigType>,
    filter?: NodeFilterType | SortedNodeFilterType,
    prependNodeNames?: ReadonlyArray<string>,
    defaultNodeNames?: ReadonlyArray<string>,
  ): ReadonlyArray<string> {
    return arguments.length === 2 && filter === undefined
      ? getClashNodeNames(list, filter)
      : getClashNodeNames(
          list,
          filter,
          prependNodeNames,
          defaultNodeNames,
          formatterOptions,
        )
  }
  const gatewayToken =
    config.gateway?.viewerToken ?? config.gateway?.accessToken

  return {
    proxyTestUrl: config.proxyTestUrl,
    proxyTestInterval: config.proxyTestInterval,
    internetTestUrl: config.internetTestUrl,
    internetTestInterval: config.internetTestInterval,
    downloadUrl:
      downloadUrl ??
      artifact.downloadUrl ??
      getDownloadUrl(config.urlBase, artifact.name, true, gatewayToken),
    snippet: loadSnippet,
    remoteSnippets: Object.fromEntries(
      remoteSnippetList.map((item) => [item.name, item]),
    ),
    nodeList,
    provider: artifact.provider,
    providerName: artifact.provider,
    artifactName: artifact.name,
    getDownloadUrl: (name: string) =>
      getDownloadUrl(config.urlBase, name, true, gatewayToken),
    getUrl: (path: string) => getUrl(config.publicUrl, path, gatewayToken),
    getNodeNames,
    getClashNodes: bindFormatter(getClashNodes),
    getClashNodeNames: boundGetClashNodeNames,
    getSingboxNodes: bindFormatter(getSingboxNodes),
    getSingboxNodeNames: bindFilterAwareFormatter(getSingboxNodeNames),
    getSingboxEndpoints,
    getSurgeNodes: bindFormatter(getSurgeNodes),
    getSurgeNodeNames: bindFormatter(getSurgeNodeNames),
    getSurgeTailscaleNodes,
    getSurgeWireguardNodes,
    getSurfboardNodes: bindFormatter(getSurfboardNodes),
    getSurfboardNodeNames: bindFormatter(getSurfboardNodeNames),
    getShadowsocksNodes,
    getShadowsocksNodesJSON,
    getShadowsocksrNodes,
    getV2rayNNodes,
    getQuantumultXNodes: bindFormatter(getQuantumultXNodes),
    getQuantumultXNodeNames: bindFormatter(getQuantumultXNodeNames),
    getLoonNodes: bindFilterAwareFormatter(getLoonNodes),
    getLoonNodeNames,
    toUrlSafeBase64,
    toBase64,
    encodeURIComponent,
    ...internalFilters,
    netflixFilter:
      mainProvider.config.netflixFilter ?? internalFilters.netflixFilter,
    youtubePremiumFilter:
      mainProvider.config.youtubePremiumFilter ??
      internalFilters.youtubePremiumFilter,
    customFilters,
    customParams,
  } as const
}
