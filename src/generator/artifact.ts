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
  ArtifactConfigInput,
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
  getNetworkConcurrency,
  getSingboxNodeNames,
  getSingboxNodes,
} from '../utils'
import { resolveDomain } from '../utils/dns'
import { internalFilters, validateFilter } from '../filters'
import { prependFlag, removeFlag } from '../utils/flag'
import { ArtifactValidator } from '../validators'
import { loadLocalSnippet } from './template'
import { render as renderJSON } from './json-template'

export interface ArtifactOptions {
  readonly remoteSnippetList?: ReadonlyArray<RemoteSnippet>
  readonly templateEngine?: Environment
}

export type ExtendableRenderContext = Record<string, string>

export class Artifact extends EventEmitter {
  public initProgress = 0
  public artifact: ArtifactConfig

  public providerNameList: ReadonlyArray<string>
  public nodeConfigListMap: Map<string, ReadonlyArray<PossibleNodeConfigType>> =
    new Map()
  public providerMap: Map<string, PossibleProviderType> = new Map()
  public nodeList: PossibleNodeConfigType[] = []

  private customFilters: NonNullable<ProviderConfig['customFilters']> = {}
  private netflixFilter: NonNullable<ProviderConfig['netflixFilter']> =
    internalFilters.netflixFilter
  private youtubePremiumFilter: NonNullable<
    ProviderConfig['youtubePremiumFilter']
  > = internalFilters.youtubePremiumFilter

  constructor(
    public surgioConfig: CommandConfig,
    artifactConfig: ArtifactConfigInput,
    private options: ArtifactOptions = {},
  ) {
    super()

    this.artifact = ArtifactValidator.parse(artifactConfig)

    const mainProviderName = this.artifact.provider
    const combineProviders = this.artifact.combineProviders || []

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
      proxyTestInterval: config.proxyTestInterval,
      internetTestUrl: config.internetTestUrl,
      internetTestInterval: config.internetTestInterval,
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
      getSingboxNodes,
      getSingboxNodeNames,
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
      toUrlSafeBase64,
      toBase64,
      encodeURIComponent,
      ...internalFilters,
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

    if (
      this.artifact.templateType === 'json' &&
      !this.artifact.extendTemplate
    ) {
      throw new Error('JSON 模板需要提供 extendTemplate 函数')
    }

    const renderContext = this.getRenderContext(extendRenderContext)
    const { templateString, template, templateType } = this.artifact
    const result = templateString
      ? targetTemplateEngine.renderString(templateString, {
          templateEngine: targetTemplateEngine,
          ...renderContext,
        })
      : templateType === 'default'
      ? targetTemplateEngine.render(`${template}.tpl`, {
          templateEngine: targetTemplateEngine,
          ...renderContext,
        })
      : renderJSON(
          this.surgioConfig.templateDir,
          `${template}.json`,
          this.artifact.extendTemplate!,
          renderContext,
        )

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
        if (provider.config.hooks?.onError && isError(err)) {
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
          nodeConfig.surgeConfig = Object.freeze({
            ...config.surgeConfig,
            ...nodeConfig.surgeConfig,
          })
          nodeConfig.clashConfig = Object.freeze({
            ...config.clashConfig,
            ...nodeConfig.clashConfig,
          })
          nodeConfig.quantumultXConfig = Object.freeze({
            ...config.quantumultXConfig,
            ...nodeConfig.quantumultXConfig,
          })
          nodeConfig.surfboardConfig = Object.freeze({
            ...config.surfboardConfig,
            ...nodeConfig.surfboardConfig,
          })

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
          if (typeof nodeConfig.tfo === 'undefined' && provider.config.tfo) {
            nodeConfig.tfo = provider.config.tfo
          }

          // MPTCP
          if (
            typeof nodeConfig.mptcp === 'undefined' &&
            provider.config.mptcp
          ) {
            nodeConfig.mptcp = provider.config.mptcp
          }

          // ECN
          if (typeof nodeConfig.ecn === 'undefined' && provider.config.ecn) {
            nodeConfig.ecn = provider.config.ecn
          }

          // Block QUIC
          if (
            typeof nodeConfig.blockQuic === 'undefined' &&
            provider.config.blockQuic
          ) {
            nodeConfig.blockQuic = provider.config.blockQuic
          }

          // Underlying Proxy
          if (!nodeConfig.underlyingProxy && provider.config.underlyingProxy) {
            nodeConfig.underlyingProxy = provider.config.underlyingProxy
          }

          // Check whether the hostname resolves in case of blocking clash's node heurestic
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
