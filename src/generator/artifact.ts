import { EventEmitter } from 'events'
import path from 'path'
import { logger as defaultLogger } from '@surgio/logger'
import fs from 'fs-extra'

import {
  GetNodeListParams,
  createProvider,
  getProvider,
  PossibleProviderType,
} from '../provider/index.js'
import {
  createArtifactRenderContext,
  mapConcurrent,
  mergeObjects,
  prepareProvider,
} from '../runtime/artifact.js'
import {
  ArtifactConfig,
  ArtifactConfigInput,
  CommandConfig,
  PossibleNodeConfigType,
  RemoteSnippet,
  SubscriptionUserinfo,
} from '../types.js'
import {
  isError,
  isSurgioError,
  SurgioError,
  getNetworkConcurrency,
} from '../utils/index.js'
import { resolveDomain } from '../utils/dns.js'
import { loadModuleSync } from '../utils/module-loader.js'
import { ArtifactValidator } from '../validators/index.js'

import { loadLocalSnippet } from './template.js'

import type { Renderer } from '../runtime/renderer.js'
import type { ProjectProviderDefinition } from '../project/types.js'
import type { ProviderRuntimeContext } from '../runtime/types.js'
import type { Logger } from '@surgio/logger'

export interface ArtifactOptions {
  readonly logger?: Logger
  readonly remoteSnippetList?: ReadonlyArray<RemoteSnippet>
  readonly renderer?: Renderer
  readonly providers?: Readonly<Record<string, ProjectProviderDefinition>>
  readonly providerRuntime?: ProviderRuntimeContext
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
  public subscriptionUserInfo?: SubscriptionUserinfo
  public subscriptionUserInfoMap: Map<string, SubscriptionUserinfo> = new Map()

  private customFilters: Record<string, unknown> = {}

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
    const mainProvider = this.providerMap.get(this.artifact.provider)
    if (!mainProvider) throw new Error('Artifact 还未初始化')

    return createArtifactRenderContext({
      artifact: this.artifact,
      config: this.surgioConfig,
      nodeList: this.nodeList,
      mainProvider,
      customFilters: this.customFilters,
      customParams: this.getMergedCustomParams(extendRenderContext),
      remoteSnippetList: this.options.remoteSnippetList,
      loadSnippet: (filePath) =>
        loadLocalSnippet(this.surgioConfig.templateDir, filePath),
      logger:
        this.options.logger ??
        this.options.providerRuntime?.logger ??
        defaultLogger,
    })
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

    await mapConcurrent(
      this.providerNameList,
      getNetworkConcurrency(),
      async (providerName) => {
        await this.providerMapper(providerName, params.getNodeListParams)
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

    const merged = mergeObjects(
      globalCustomParams,
      artifactCustomParams,
      extendableCustomParams,
    )

    return Object.freeze(merged)
  }

  public render(extendRenderContext?: ExtendableRenderContext): string {
    if (!this.isReady) {
      throw new Error('Artifact 还未初始化')
    }

    const renderer = this.options.renderer
    if (!renderer) throw new Error('没有可用的 Renderer')

    const renderContext = this.getRenderContext(extendRenderContext)
    const result = renderer.renderArtifact(this.artifact, renderContext)

    this.emit('renderArtifact', { artifact: this.artifact, result })

    return result
  }

  private async providerMapper(
    providerName: string,
    getNodeListParams: GetNodeListParams = {},
  ): Promise<void> {
    const config = this.surgioConfig
    const mainProviderName = this.artifact.provider
    const definition = this.options.providers?.[providerName]
    if (this.options.providers && !definition) {
      throw new Error(`Provider ${providerName} 未在 Surgio Project 中注册`)
    }
    const filePath = definition
      ? `surgio.project.ts#providers.${providerName}`
      : path.resolve(config.providerDir, `${providerName}.js`)

    this.emit('initProvider:start', {
      artifact: this.artifact,
      providerName,
    })

    if (!definition && !fs.existsSync(filePath)) {
      throw new Error(`文件 ${filePath} 不存在`)
    }

    let provider: PossibleProviderType

    try {
      const providerDefinition =
        definition ?? loadModuleSync<ProjectProviderDefinition>(filePath)
      provider = this.options.providerRuntime
        ? await createProvider(
            providerName,
            providerDefinition,
            this.options.providerRuntime,
          )
        : await getProvider(providerName, providerDefinition)
      this.providerMap.set(providerName, provider)
    } catch (_err) /* istanbul ignore next -- @preserve */ {
      const err = _err
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

    let result
    try {
      result = await prepareProvider({
        provider,
        providerName,
        providerPath: filePath,
        params: this.getMergedCustomParams(
          getNodeListParams,
        ) as GetNodeListParams,
        config,
        concurrency: getNetworkConcurrency(),
        resolveDomain,
        logger:
          this.options.logger ??
          this.options.providerRuntime?.logger ??
          defaultLogger,
        providerRuntime: this.options.providerRuntime,
      })
    } catch (err) /* istanbul ignore next -- @preserve */ {
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

    const { nodeList: nodeConfigList, subscriptionUserInfo } = result
    this.nodeConfigListMap.set(providerName, nodeConfigList)

    // Filter 仅使用第一个 Provider 中的定义
    if (providerName === mainProviderName) {
      this.customFilters = {
        ...config.customFilters,
        ...provider.config.customFilters,
        ...this.artifact.customFilters,
      }
    }

    // Store subscriptionUserInfo for all providers in the map
    if (subscriptionUserInfo) {
      this.subscriptionUserInfoMap.set(providerName, subscriptionUserInfo)

      if (
        this.artifact.subscriptionUserInfoProvider &&
        providerName === this.artifact.subscriptionUserInfoProvider
      ) {
        this.subscriptionUserInfo = subscriptionUserInfo
      } else if (providerName === mainProviderName) {
        this.subscriptionUserInfo = subscriptionUserInfo
      }
    }

    this.initProgress++

    this.emit('initProvider:end', {
      artifact: this.artifact,
      providerName,
      provider,
    })
  }
}
