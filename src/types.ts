import { z } from 'zod'

import {
  WireguardNodeConfigValidator,
  ProviderValidator,
  ShadowsocksNodeConfigValidator,
  HttpNodeConfigValidator,
  HttpsNodeConfigValidator,
  TrojanNodeConfigValidator,
  ShadowsocksrNodeConfigValidator,
  Socks5NodeConfigValidator,
  VmessNodeConfigValidator,
  SnellNodeConfigValidator,
  TuicNodeConfigValidator,
  SurgioConfigValidator,
  ArtifactValidator,
  RemoteSnippetValidator,
  NodeFilterTypeValidator,
  SortedNodeFilterTypeValidator,
  Hysteria2NodeConfigValidator,
  ClashCoreValidator,
  VlessNodeConfigValidator,
} from './validators'

import type { Provider, GetNodeListParams } from './provider'

export enum NodeTypeEnum {
  HTTPS = 'https',
  HTTP = 'http',
  Shadowsocks = 'shadowsocks',
  Shadowsocksr = 'shadowsocksr',
  Snell = 'snell',
  Vmess = 'vmess',
  Vless = 'vless',
  Trojan = 'trojan',
  Socks5 = 'socks5',
  Tuic = 'tuic',
  Wireguard = 'wireguard',
  Hysteria2 = 'hysteria2',
}

export enum SupportProviderEnum {
  Clash = 'clash',
  Custom = 'custom',
  ShadowsocksSubscribe = 'shadowsocks_subscribe',
  ShadowsocksrSubscribe = 'shadowsocksr_subscribe',
  ShadowsocksJsonSubscribe = 'shadowsocks_json_subscribe',
  V2rayNSubscribe = 'v2rayn_subscribe',
  BlackSSL = 'blackssl',
  Ssd = 'ssd',
  Trojan = 'trojan',
}

export type CommandConfigBeforeNormalize = z.input<typeof SurgioConfigValidator>

export type CommandConfigAfterNormalize = z.infer<typeof SurgioConfigValidator>

export type CommandConfig = CommandConfigAfterNormalize & {
  publicUrl: string
  output: string
  urlBase: string
  providerDir: string
  templateDir: string
  configDir: string
}

export type RemoteSnippetConfig = z.infer<typeof RemoteSnippetValidator>

export interface RemoteSnippet extends RemoteSnippetConfig {
  readonly main: (...args: string[]) => string
  readonly text: string
}

export type ArtifactConfig = z.infer<typeof ArtifactValidator>

export type ArtifactConfigInput = z.input<typeof ArtifactValidator>

export type ProviderConfig = z.infer<typeof ProviderValidator>

export interface BlackSSLProviderConfig extends ProviderConfig {
  readonly type: SupportProviderEnum.BlackSSL
  readonly username: string
  readonly password: string
}

export interface ShadowsocksJsonSubscribeProviderConfig extends ProviderConfig {
  readonly type: SupportProviderEnum.ShadowsocksJsonSubscribe
  readonly url: string
  readonly udpRelay?: boolean
}

export interface ShadowsocksSubscribeProviderConfig extends ProviderConfig {
  readonly type: SupportProviderEnum.ShadowsocksSubscribe
  readonly url: string
  readonly udpRelay?: boolean
}

export interface ShadowsocksrSubscribeProviderConfig extends ProviderConfig {
  readonly type: SupportProviderEnum.ShadowsocksrSubscribe
  readonly url: string
  readonly udpRelay?: boolean
}

export interface V2rayNSubscribeProviderConfig extends ProviderConfig {
  readonly type: SupportProviderEnum.V2rayNSubscribe
  readonly url: string
  readonly compatibleMode?: boolean
  readonly skipCertVerify?: boolean
  readonly udpRelay?: boolean
  readonly tls13?: boolean
}

export interface ClashProviderConfig extends ProviderConfig {
  readonly type: SupportProviderEnum.Clash
  readonly url: string
  readonly udpRelay?: boolean
  readonly tls13?: boolean
}

export interface SsdProviderConfig extends ProviderConfig {
  readonly type: SupportProviderEnum.Ssd
  readonly url: string
  readonly udpRelay?: boolean
}

export type AsyncCustomProviderNodeList = (
  params: GetNodeListParams,
) => Promise<ReadonlyArray<PossibleNodeConfigType>>

export interface CustomProviderConfig extends ProviderConfig {
  readonly type: SupportProviderEnum.Custom
  readonly nodeList:
    | ReadonlyArray<PossibleNodeConfigType>
    | AsyncCustomProviderNodeList
}

export interface TrojanProviderConfig extends ProviderConfig {
  readonly type: SupportProviderEnum.Trojan
  readonly url: string
  readonly udpRelay?: boolean
  readonly tls13?: boolean
}

export type HttpNodeConfig = z.infer<typeof HttpNodeConfigValidator> &
  SurgioInternals

export type HttpsNodeConfig = z.infer<typeof HttpsNodeConfigValidator> &
  SurgioInternals

export type TrojanNodeConfig = z.infer<typeof TrojanNodeConfigValidator> &
  SurgioInternals

export type ShadowsocksNodeConfig = z.infer<
  typeof ShadowsocksNodeConfigValidator
> &
  SurgioInternals

export type ShadowsocksrNodeConfig = z.infer<
  typeof ShadowsocksrNodeConfigValidator
> &
  SurgioInternals

export type Socks5NodeConfig = z.infer<typeof Socks5NodeConfigValidator> &
  SurgioInternals

export type SnellNodeConfig = z.infer<typeof SnellNodeConfigValidator> &
  SurgioInternals

export type VmessNodeConfig = z.infer<typeof VmessNodeConfigValidator> &
  SurgioInternals

export type VlessNodeConfig = z.infer<typeof VlessNodeConfigValidator> &
  SurgioInternals

export type TuicNodeConfig = z.infer<typeof TuicNodeConfigValidator> &
  SurgioInternals

export type WireguardNodeConfig = z.infer<typeof WireguardNodeConfigValidator> &
  SurgioInternals

export type Hysteria2NodeConfig = z.infer<typeof Hysteria2NodeConfigValidator> &
  SurgioInternals

export interface SurgioInternals {
  provider?: Provider
}

export interface SubscriptionUserinfo {
  readonly upload: number
  readonly download: number
  readonly total: number
  readonly expire: number
}

export interface SubsciptionCacheItem {
  readonly body: string
  subscriptionUserinfo?: SubscriptionUserinfo
}

export type NodeFilterType = z.infer<typeof NodeFilterTypeValidator>

export type SortedNodeFilterType = z.infer<typeof SortedNodeFilterTypeValidator>

export type PossibleNodeConfigType =
  | HttpsNodeConfig
  | HttpNodeConfig
  | ShadowsocksNodeConfig
  | ShadowsocksrNodeConfig
  | SnellNodeConfig
  | VmessNodeConfig
  | VlessNodeConfig
  | TrojanNodeConfig
  | Socks5NodeConfig
  | TuicNodeConfig
  | WireguardNodeConfig
  | Hysteria2NodeConfig

export type PossibleProviderConfigType =
  | BlackSSLProviderConfig
  | ClashProviderConfig
  | CustomProviderConfig
  | ShadowsocksJsonSubscribeProviderConfig
  | ShadowsocksrSubscribeProviderConfig
  | ShadowsocksSubscribeProviderConfig
  | SsdProviderConfig
  | TrojanProviderConfig
  | V2rayNSubscribeProviderConfig

export type ClashCoreType = z.infer<typeof ClashCoreValidator>
