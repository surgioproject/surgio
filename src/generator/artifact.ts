import { logger } from '@surgio/logger'
import Bluebird from 'bluebird'
import { EventEmitter } from 'events'
import fs from 'fs-extra'
import _ from 'lodash'
import { Environment } from 'nunjucks'
import path from 'path'

import {
  CustomProvider,
  GetNodeListParams,
  getProvider,
  PossibleProviderType,
} from '../provider'
import {
  ArtifactConfig,
  CommandConfig,
  NodeTypeEnum,
  PossibleNodeConfigType,
  ProviderConfig,
  RemoteSnippet,
  SupportProviderEnum,
} from '../types'
import {
  getClashNodeNames,
  getClashNodes,
  getDownloadUrl,
  getLoonNodeNames,
  getLoonNodes,
  getNodeNames,
  getQuantumultXNodeNames,
  getQuantumultXNodes,
  getShadowsocksNodes,
  getShadowsocksNodesJSON,
  getShadowsocksrNodes,
  getSurfboardNodeNames,
  getSurfboardNodes,
  getSurgeNodeNames,
  getSurgeNodes,
  getSurgeWireguardNodes,
  getUrl,
  getV2rayNNodes,
  isError,
  isIp,
  isSurgioError,
  SurgioError,
  toBase64,
  toUrlSafeBase64,
} from '../utils'
import { resolveDomain } from '../utils/dns'
import { getNetworkConcurrency } from '../utils/env-flag'
import {
  chinaBackFilter,
  chinaOutFilter,
  hkFilter,
  httpFilter,
  httpsFilter,
  japanFilter,
  koreaFilter,
  netflixFilter as defaultNetflixFilter,
  shadowsocksFilter,
  shadowsocksrFilter,
  singaporeFilter,
  snellFilter,
  socks5Filter,
  taiwanFilter,
  trojanFilter,
  usFilter,
  v2rayFilter,
  validateFilter,
  vmessFilter,
  wireguardFilter,
  youtubePremiumFilter as defaultYoutubePremiumFilter,
} from '../utils/filter'
import { prependFlag, removeFlag } from '../utils/flag'
import { loadLocalSnippet } from './template'

export interface ArtifactOptions {
  readonly remoteSnippetList?: ReadonlyArray<RemoteSnippet>
  readonly templateEngine?: Environment
}

export type ExtendableRenderContext = Record<string, string>

export class Artifact extends EventEmitter {
  public initProgress = 0

  public providerNameList: ReadonlyArray<string>
  public nodeConfigListMap: Map<string, ReadonlyArray<PossibleNodeConfigType>> =
    new Map()
  public providerMap: Map<string, PossibleProviderType> = new Map()
  public nodeList: PossibleNodeConfigType[] = []

  private customFilters: NonNullable<ProviderConfig['customFilters']> = {}
  private netflixFilter: NonNullable<ProviderConfig['netflixFilter']> =
    defaultNetflixFilter
  private youtubePremiumFilter: NonNullable<
    ProviderConfig['youtubePremiumFilter']
  > = defaultYoutubePremiumFilter

  constructor(
    public surgioConfig: CommandConfig,
    public artifact: ArtifactConfig,
    private options: ArtifactOptions = {},
  ) {
    super()

    const mainProviderName = artifact.provider
    const combineProviders = artifact.combineProviders || []

    this.providerNameList = [mainProviderName].concat(combineProviders)
  }

  public get isReady(): boolean {
    return this.initProgress === this.providerNameList.length
  }

  public getRenderContext(extendRenderContext: ExtendableRenderContext = {}) {
    const config = this.surgioConfig
    const gatewayConfig = config.gateway
    const gatewayToken =
      gatewayConfig?.viewerToken || gatewayConfig?.accessToken
    const { name: artifactName, downloadUrl } = this.artifact
    const { nodeList, netflixFilter, youtubePremiumFilter, customFilters } =
      this
    const remoteSnippets = _.keyBy(
      this.options.remoteSnippetList || [],
      (item) => item.name,
    )
    const mergedCustomParams = this.getMergedCustomParams(extendRenderContext)

    return {
      proxyTestUrl: config.proxyTestUrl,
      internetTestUrl: config.internetTestUrl,
      downloadUrl: downloadUrl
        ? downloadUrl
        : getDownloadUrl(config.urlBase, artifactName, true, gatewayToken),
      snippet: (filePath: string): RemoteSnippet => {
        return loadLocalSnippet(config.templateDir, filePath)
      },
      remoteSnippets,
      nodeList,
      provider: this.artifact.provider,
      providerName: this.artifact.provider,
      artifactName,
      getDownloadUrl: (name: string) =>
        getDownloadUrl(config.urlBase, name, true, gatewayToken),
      getUrl: (p: string) => getUrl(config.publicUrl, p, gatewayToken),
      getNodeNames,
      getClashNodes,
      getClashNodeNames,
      getSurgeNodes,
      getSurgeNodeNames,
      getSurgeWireguardNodes,
      getSurfboardNodes,
      getSurfboardNodeNames,
      getShadowsocksNodes,
      getShadowsocksNodesJSON,
      getShadowsocksrNodes,
      getV2rayNNodes,
      getQuantumultXNodes,
      getQuantumultXNodeNames,
      getLoonNodes,
      getLoonNodeNames,
      usFilter,
      hkFilter,
      japanFilter,
      koreaFilter,
      singaporeFilter,
      taiwanFilter,
      chinaBackFilter,
      chinaOutFilter,
      shadowsocksFilter,
      shadowsocksrFilter,
      vmessFilter,
      v2rayFilter,
      snellFilter,
      httpFilter,
      httpsFilter,
      trojanFilter,
      socks5Filter,
      wireguardFilter,
      toUrlSafeBase64,
      toBase64,
      encodeURIComponent,
      netflixFilter,
      youtubePremiumFilter,
      customFilters,
      customParams: mergedCustomParams,
    } as const
  }

  public async init(
    params: {
      getNodeListParams?: GetNodeListParams
    } = {},
  ): Promise<this> {
    if (this.isReady) {
      throw new Error('Artifact 已经初始化完成')
    }

    this.emit('initArtifact:start', { artifact: this.artifact })

    await Bluebird.map(
      this.providerNameList,
      async (providerName) => {
        await this.providerMapper(providerName, params.getNodeListParams)
      },
      {
        concurrency: getNetworkConcurrency(),
      },
    )

    this.providerNameList.forEach((providerName) => {
      const nodeConfigList = this.nodeConfigListMap.get(providerName)

      if (nodeConfigList) {
        nodeConfigList.forEach((nodeConfig) => {
          if (nodeConfig) {
            this.nodeList.push(nodeConfig)
          }
        })
      }
    })

    this.emit('initArtifact:end', { artifact: this.artifact })

    return this
  }

  public getMergedCustomParams(
    extendableCustomParams: Record<string, any> = {},
  ): Readonly<Record<string, any>> {
    const globalCustomParams = this.surgioConfig.customParams
    const { customParams: artifactCustomParams } = this.artifact

    const merged = _.merge(
      {},
      globalCustomParams,
      artifactCustomParams,
      extendableCustomParams,
    )

    return Object.freeze(merged)
  }

  public render(
    templateEngine?: Environment,
    extendRenderContext?: ExtendableRenderContext,
  ): string {
    if (!this.isReady) {
      throw new Error('Artifact 还未初始化')
    }

    const targetTemplateEngine = templateEngine || this.options.templateEngine

    if (!targetTemplateEngine) {
      throw new Error('没有可用的 Nunjucks 环境')
    }

    const renderContext = this.getRenderContext(extendRenderContext)
    const { templateString, template } = this.artifact
    const result = templateString
      ? targetTemplateEngine.renderString(templateString, {
          templateEngine: targetTemplateEngine,
          ...renderContext,
        })
      : targetTemplateEngine.render(`${template}.tpl`, {
          templateEngine: targetTemplateEngine,
          ...renderContext,
        })

    this.emit('renderArtifact', { artifact: this.artifact, result })

    return result
  }

  private async providerMapper(
    providerName: string,
    getNodeListParams: GetNodeListParams = {},
  ): Promise<void> {
    const config = this.surgioConfig
    const mainProviderName = this.artifact.provider
    const filePath = path.resolve(config.providerDir, `${providerName}.js`)

    this.emit('initProvider:start', {
      artifact: this.artifact,
      providerName,
    })

    if (!fs.existsSync(filePath)) {
      throw new Error(`文件 ${filePath} 不存在`)
    }

    let provider: PossibleProviderType
    let nodeConfigList: ReadonlyArray<PossibleNodeConfigType>

    try {
      // eslint-disable-next-line prefer-const
      provider = await getProvider(providerName, require(filePath))
      this.providerMap.set(providerName, provider)
    } catch (err) /* istanbul ignore next */ {
      if (isSurgioError(err)) {
        err.providerName = providerName
        err.providerPath = filePath
        throw err
      } else {
        throw new SurgioError(
          isError(err) ? err.message : '处理 Provider 失败',
          {
            cause: err,
            providerName,
            providerPath: filePath,
          },
        )
      }
    }

    try {
      try {
        nodeConfigList = await provider.getNodeList(
          this.getMergedCustomParams(getNodeListParams),
        )
      } catch (err) {
        if (provider.config.hooks?.onError) {
          const result = await provider.config.hooks.onError(err)

          if (Array.isArray(result)) {
            const adHocProvider = new CustomProvider('ad-hoc', {
              type: SupportProviderEnum.Custom,
              nodeList: result,
            })

            nodeConfigList = await adHocProvider.getNodeList()
          } else {
            nodeConfigList = []
          }
        } else {
          throw err
        }
      }
    } catch (err) /* istanbul ignore next */ {
      if (isSurgioError(err)) {
        err.providerName = providerName
        err.providerPath = filePath
        throw err
      } else {
        throw new SurgioError(
          isError(err) ? err.message : '处理 Provider 失败',
          {
            cause: err,
            providerName,
            providerPath: filePath,
          },
        )
      }
    }

    // Filter 仅使用第一个 Provider 中的定义
    if (providerName === mainProviderName) {
      if (provider.config.netflixFilter !== undefined) {
        this.netflixFilter = provider.config.netflixFilter
      }
      if (provider.config.youtubePremiumFilter !== undefined) {
        this.youtubePremiumFilter = provider.config.youtubePremiumFilter
      }
      this.customFilters = {
        ...this.customFilters,
        ...config.customFilters,
        ...provider.config.customFilters,
      }
    }

    if (
      validateFilter(provider.config.nodeFilter) &&
      typeof provider.config.nodeFilter === 'object' &&
      provider.config.nodeFilter.supportSort
    ) {
      nodeConfigList = provider.config.nodeFilter.filter(nodeConfigList)
    }

    nodeConfigList = (
      await Bluebird.map(nodeConfigList, async (nodeConfig) => {
        let isValid = false

        if (nodeConfig.enable === false) {
          return undefined
        }

        if (!provider.config.nodeFilter) {
          isValid = true
        } else if (validateFilter(provider.config.nodeFilter)) {
          isValid =
            typeof provider.config.nodeFilter === 'function'
              ? provider.config.nodeFilter(nodeConfig)
              : true
        }

        if (isValid) {
          if (
            config.binPath &&
            nodeConfig.type === NodeTypeEnum.Shadowsocksr &&
            config.binPath[nodeConfig.type]
          ) {
            nodeConfig.binPath = config.binPath[nodeConfig.type]
            nodeConfig.localPort = provider.nextPort
          }

          nodeConfig.provider = provider
          nodeConfig.surgeConfig = config.surgeConfig
          nodeConfig.clashConfig = config.clashConfig
          nodeConfig.quantumultXConfig = config.quantumultXConfig
          nodeConfig.surfboardConfig = config.surfboardConfig

          if (provider.config.renameNode) {
            const newName = provider.config.renameNode(nodeConfig.nodeName)

            if (newName) {
              nodeConfig.nodeName = newName
            }
          }

          if (provider.config.addFlag) {
            // 给节点名加国旗
            nodeConfig.nodeName = prependFlag(
              nodeConfig.nodeName,
              provider.config.removeExistingFlag,
            )
          } else if (provider.config.removeExistingFlag) {
            // 去掉名称中的国旗
            nodeConfig.nodeName = removeFlag(nodeConfig.nodeName)
          }

          // TCP Fast Open
          if (provider.config.tfo) {
            nodeConfig.tfo = provider.config.tfo
          }

          // MPTCP
          if (provider.config.mptcp) {
            nodeConfig.mptcp = provider.config.mptcp
          }

          // Underlying Proxy
          if (!nodeConfig.underlyingProxy && provider.config.underlyingProxy) {
            nodeConfig.underlyingProxy = provider.config.underlyingProxy
          }

          // check whether the hostname resolves in case of blocking clash's node heurestic
          if (
            config?.checkHostname &&
            'hostname' in nodeConfig &&
            !isIp(nodeConfig.hostname)
          ) {
            try {
              const domains = await resolveDomain(nodeConfig.hostname)
              if (domains.length < 1) {
                logger.warn(
                  `DNS 解析结果中 ${nodeConfig.hostname} 未有对应 IP 地址，将忽略该节点`,
                )
                return undefined
              }
            } catch (err) /* istanbul ignore next */ {
              logger.warn(`${nodeConfig.hostname} 无法解析，将忽略该节点`)
              return undefined
            }
          }

          if (
            config?.surgeConfig?.resolveHostname &&
            'hostname' in nodeConfig &&
            !isIp(nodeConfig.hostname) &&
            [NodeTypeEnum.Vmess, NodeTypeEnum.Shadowsocksr].includes(
              nodeConfig.type,
            )
          ) {
            try {
              nodeConfig.hostnameIp = await resolveDomain(nodeConfig.hostname)
            } catch (err) /* istanbul ignore next */ {
              logger.warn(
                `${nodeConfig.hostname} 无法解析，将忽略该域名的解析结果`,
              )
            }
          }

          return nodeConfig
        }

        return undefined
      })
    ).filter((item): item is PossibleNodeConfigType => item !== undefined)

    this.nodeConfigListMap.set(providerName, nodeConfigList)
    this.initProgress++

    this.emit('initProvider:end', {
      artifact: this.artifact,
      providerName,
      provider,
    })
  }
}
