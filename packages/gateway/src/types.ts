export type GatewayRole = 'admin' | 'viewer'

export interface GatewayUser {
  readonly roles: ReadonlyArray<GatewayRole>
  // Only set when authProvider resolved the user.
  readonly linkToken?: string
}

export type GatewayAuthResult =
  | { readonly success: true; readonly accessToken: string }
  | { readonly success: false }

export type GatewayAuthProvider = (input: {
  readonly request: Request
}) => Promise<GatewayAuthResult>

export interface GatewayConfig {
  readonly urlBase: string
  readonly publicUrl: string
  readonly coreVersion: string
  readonly accessToken?: string
  readonly viewerToken?: string
  readonly authProvider?: GatewayAuthProvider
  readonly auth?: boolean
  readonly cookieMaxAge?: number
  readonly useCacheOnError?: boolean
  readonly passRequestUserAgent?: boolean
  readonly passRequestHeaders?: ReadonlyArray<string>
}

export interface GatewayArtifact {
  readonly name: string
  readonly [key: string]: unknown
}

export interface GatewayProviderInfo {
  readonly name: string
  readonly type: string
  readonly url?: string
  readonly supportGetSubscriptionUserInfo: boolean
}

export interface GatewaySubscriptionUserInfo {
  readonly upload: number
  readonly download: number
  readonly total: number
  readonly expire: number
}

export interface GatewayRenderResult {
  readonly body: string
  readonly artifact: GatewayArtifact
  readonly subscriptionUserInfo?: Readonly<Record<string, number>>
  readonly subscriptionUserInfoMap: Readonly<Record<string, unknown>>
}

export interface GatewayRuntime {
  renderArtifact(
    name: string,
    options?: Record<string, unknown>
  ): Promise<GatewayRenderResult>
  renderProviders(
    options: Record<string, unknown>
  ): Promise<GatewayRenderResult>
  renderTemplate(
    name: string,
    context?: Readonly<Record<string, unknown>>
  ): Promise<string>
  listArtifacts(): ReadonlyArray<GatewayArtifact>
  listProviders(): ReadonlyArray<string>
  getProviderInfo(name: string): Promise<GatewayProviderInfo | undefined>
  getProviderSubscription(
    name: string
  ): Promise<GatewaySubscriptionUserInfo | undefined>
  getGatewayConfig(): GatewayConfig | undefined
  resetCache(): Promise<void>
  close(): Promise<void>
}

export interface GatewayCache {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
}

export interface GatewayLogger {
  warn(message: string, error?: unknown): void
  error(message: string, error?: unknown): void
}

export interface GatewayAssets {
  fetch(request: Request): Promise<Response>
}
