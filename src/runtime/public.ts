import type { TtlCache } from '../cache/core.js'
import type {
  ArtifactConfig,
  NodeFilterType,
  SortedNodeFilterType,
  SubscriptionUserinfo,
} from '../types.js'
import type {
  RuntimeDomainResolver,
  RuntimeLogger,
  RuntimeNetworkOptions,
} from './types.js'

export type ProviderFormat =
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

export interface RenderArtifactOptions {
  readonly customParams?: Readonly<Record<string, unknown>>
  readonly downloadUrl?: string
  readonly filter?: string | NodeFilterType | SortedNodeFilterType
  readonly format?: ProviderFormat
  readonly getNodeListParams?: Readonly<Record<string, unknown>>
}

export interface RenderProvidersOptions extends RenderArtifactOptions {
  readonly providers: string | ReadonlyArray<string>
  readonly template?: string
}

export interface RuntimeRenderResult {
  readonly body: string
  readonly artifact: ArtifactConfig
  readonly subscriptionUserInfo?: SubscriptionUserinfo
  readonly subscriptionUserInfoMap: Readonly<
    Record<string, SubscriptionUserinfo>
  >
}

export interface ProviderSummary {
  readonly name: string
  readonly type: string
  readonly url?: string
  readonly supportGetSubscriptionUserInfo: boolean
}

export interface SurgioRuntime {
  renderArtifact(
    name: string,
    options?: RenderArtifactOptions,
  ): Promise<RuntimeRenderResult>
  renderProviders(options: RenderProvidersOptions): Promise<RuntimeRenderResult>
  renderTemplate(
    name: string,
    context?: Readonly<Record<string, unknown>>,
  ): Promise<string>
  listArtifacts(): ReadonlyArray<ArtifactConfig>
  listProviders(): ReadonlyArray<string>
  getProviderInfo(name: string): Promise<ProviderSummary | undefined>
  getProviderSubscription(
    name: string,
    params?: Readonly<Record<string, unknown>>,
  ): Promise<SubscriptionUserinfo | undefined>
  getGatewayConfig(): ArtifactRuntimeGatewayConfig | undefined
  resetCache(): Promise<void>
  close(): Promise<void>
}

export interface ArtifactRuntimeGatewayConfig {
  readonly urlBase: string
  readonly publicUrl: string
  readonly coreVersion: string
  readonly accessToken?: string
  readonly viewerToken?: string
  readonly auth?: boolean
  readonly cookieMaxAge?: number
  readonly useCacheOnError?: boolean
  readonly passRequestUserAgent?: boolean
  readonly passRequestHeaders?: ReadonlyArray<string>
}

export interface RuntimeOptions {
  readonly cache: TtlCache
  readonly fetch?: typeof globalThis.fetch
  readonly resolveDomain?: RuntimeDomainResolver
  readonly logger?: RuntimeLogger
  readonly network?: RuntimeNetworkOptions
}
