import type { TtlCache } from '../cache/core.js'
import type {
  ArtifactConfig,
  ArtifactConfigInput,
  CommandConfigAfterNormalize,
  CommandConfigBeforeNormalize,
  PossibleProviderConfigType,
  SubscriptionUserinfo,
} from '../types.js'
import type {
  RuntimeDomainResolver,
  RuntimeLogger,
  RuntimeNetworkOptions,
} from '../runtime/types.js'

export type WorkerProviderDefinition =
  | PossibleProviderConfigType
  | (() => PossibleProviderConfigType | Promise<PossibleProviderConfigType>)

export interface WorkerProjectDefinition {
  readonly config: CommandConfigBeforeNormalize
  readonly providers: Readonly<Record<string, WorkerProviderDefinition>>
  readonly templateDir?: string
}

export interface WorkerRuntimeConfig extends CommandConfigAfterNormalize {
  readonly publicUrl: string
  readonly urlBase: string
}

export interface WorkerCompiledTemplate {
  readonly root: (...args: any[]) => void
  readonly [key: string]: unknown
}

export interface WorkerManifest {
  readonly surgioVersion: string
  readonly config: CommandConfigBeforeNormalize
  readonly providers: Readonly<Record<string, WorkerProviderDefinition>>
  readonly templates: Readonly<Record<string, WorkerCompiledTemplate>>
  readonly rawTemplates: Readonly<Record<string, string>>
  readonly jsonTemplates: Readonly<Record<string, unknown>>
  readonly artifactTemplates: Readonly<Record<string, string>>
}

export interface WorkerRuntimeOptions {
  readonly cache: TtlCache
  readonly fetch?: typeof globalThis.fetch
  readonly resolveDomain?: RuntimeDomainResolver
  readonly logger?: RuntimeLogger
  readonly network?: RuntimeNetworkOptions
}

export interface RenderArtifactOptions {
  readonly customParams?: Readonly<Record<string, unknown>>
  readonly downloadUrl?: string
  readonly filter?: string
  readonly format?: WorkerProviderFormat
  readonly getNodeListParams?: Readonly<Record<string, unknown>>
}

export interface RenderProvidersOptions extends RenderArtifactOptions {
  readonly providers: string | ReadonlyArray<string>
  readonly template?: string
}

export interface WorkerRenderResult {
  readonly body: string
  readonly artifact: ArtifactConfig
  readonly subscriptionUserInfo?: SubscriptionUserinfo
  readonly subscriptionUserInfoMap: Readonly<
    Record<string, SubscriptionUserinfo>
  >
}

export type WorkerProviderFormat =
  | 'clash'
  | 'clash-provider'
  | 'loon'
  | 'quantumultx'
  | 'shadowsocks'
  | 'shadowsocks-json'
  | 'shadowsocksr'
  | 'singbox'
  | 'surfboard'
  | 'surge'
  | 'v2rayn'

export interface SurgioRuntime {
  renderArtifact(
    name: string,
    options?: RenderArtifactOptions,
  ): Promise<WorkerRenderResult>
  renderProviders(options: RenderProvidersOptions): Promise<WorkerRenderResult>
  renderTemplate(
    name: string,
    context?: Readonly<Record<string, unknown>>,
  ): Promise<string>
  listArtifacts(): ReadonlyArray<ArtifactConfig>
  listProviders(): ReadonlyArray<string>
  getProviderSubscription(
    name: string,
    params?: Readonly<Record<string, unknown>>,
  ): Promise<SubscriptionUserinfo | undefined>
  close(): Promise<void>
}

export type WorkerArtifactInput = ArtifactConfigInput
