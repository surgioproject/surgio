import { z } from 'zod';

import Provider from './provider/Provider';
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
  SimpleNodeConfigValidator,
  SurgioConfigValidator,
  ArtifactValidator,
  RemoteSnippetValidator,
} from './validators';

export enum NodeTypeEnum {
  HTTPS = 'https',
  HTTP = 'http',
  Shadowsocks = 'shadowsocks',
  Shadowsocksr = 'shadowsocksr',
  Snell = 'snell',
  Vmess = 'vmess',
  Trojan = 'trojan',
  Socks5 = 'socks5',
  Tuic = 'tuic',
  Wireguard = 'wireguard',
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

export type CommandConfigBeforeNormalize = z.infer<
  typeof SurgioConfigValidator
>;

export type CommandConfig = CommandConfigBeforeNormalize & {
  publicUrl: string;
  output: string;
  urlBase: string;
  providerDir: string;
  templateDir: string;
  configDir: string;
  customFilters?: {
    [name: string]: NodeNameFilterType | SortedNodeNameFilterType;
  };
};

export type RemoteSnippetConfig = z.infer<typeof RemoteSnippetValidator>;

export interface RemoteSnippet extends RemoteSnippetConfig {
  readonly main: (...args: string[]) => string;
  readonly text: string;
}

export type ArtifactConfig = z.infer<typeof ArtifactValidator> & {
  readonly template: string | undefined;
};

export type ProviderConfig = z.infer<typeof ProviderValidator> & {
  readonly nodeFilter?: NodeFilterType | SortedNodeNameFilterType;
  readonly netflixFilter?: NodeNameFilterType | SortedNodeNameFilterType;
  readonly youtubePremiumFilter?: NodeNameFilterType | SortedNodeNameFilterType;
  readonly customFilters?: {
    readonly [name: string]: NodeNameFilterType | SortedNodeNameFilterType;
  };
};

export interface BlackSSLProviderConfig extends ProviderConfig {
  readonly username: string;
  readonly password: string;
}

export interface ShadowsocksJsonSubscribeProviderConfig extends ProviderConfig {
  readonly url: string;
  readonly udpRelay?: boolean;
}

export interface ShadowsocksSubscribeProviderConfig extends ProviderConfig {
  readonly url: string;
  readonly udpRelay?: boolean;
}

export interface ShadowsocksrSubscribeProviderConfig extends ProviderConfig {
  readonly url: string;
  readonly udpRelay?: boolean;
}

export interface V2rayNSubscribeProviderConfig extends ProviderConfig {
  readonly url: string;
  readonly compatibleMode?: boolean;
  readonly skipCertVerify?: boolean;
  readonly udpRelay?: boolean;
  readonly tls13?: boolean;
}

export interface ClashProviderConfig extends ProviderConfig {
  readonly url: string;
  readonly udpRelay?: boolean;
  readonly tls13?: boolean;
}

export interface SsdProviderConfig extends ProviderConfig {
  readonly url: string;
  readonly udpRelay?: boolean;
}

export interface CustomProviderConfig extends ProviderConfig {
  readonly nodeList: ReadonlyArray<unknown>;
}

export interface TrojanProviderConfig extends ProviderConfig {
  readonly url: string;
  readonly udpRelay?: boolean;
  readonly tls13?: boolean;
}

export type HttpNodeConfig = z.infer<typeof HttpNodeConfigValidator> &
  SurgioInternals;

export type HttpsNodeConfig = z.infer<typeof HttpsNodeConfigValidator> &
  SurgioInternals;

export type TrojanNodeConfig = z.infer<typeof TrojanNodeConfigValidator> &
  SurgioInternals;

export type ShadowsocksNodeConfig = z.infer<
  typeof ShadowsocksNodeConfigValidator
> &
  SurgioInternals;

export type ShadowsocksrNodeConfig = z.infer<
  typeof ShadowsocksrNodeConfigValidator
> &
  SurgioInternals;

export type Socks5NodeConfig = z.infer<typeof Socks5NodeConfigValidator> &
  SurgioInternals;

export type SnellNodeConfig = z.infer<typeof SnellNodeConfigValidator> &
  SurgioInternals;

export type VmessNodeConfig = z.infer<typeof VmessNodeConfigValidator> &
  SurgioInternals;

export type TuicNodeConfig = z.infer<typeof TuicNodeConfigValidator> &
  SurgioInternals;

export type WireguardNodeConfig = z.infer<typeof WireguardNodeConfigValidator> &
  SurgioInternals;

export interface SurgioInternals {
  binPath?: string;
  localPort?: number;
  surgeConfig?: CommandConfig['surgeConfig'];
  clashConfig?: CommandConfig['clashConfig'];
  quantumultXConfig?: CommandConfig['quantumultXConfig'];
  surfboardConfig?: CommandConfig['surfboardConfig'];
  hostnameIp?: ReadonlyArray<string>;
  provider?: Provider;
}

export type SimpleNodeConfig = z.infer<typeof SimpleNodeConfigValidator> &
  SurgioInternals;

export interface SubscriptionUserinfo {
  readonly upload: number;
  readonly download: number;
  readonly total: number;
  readonly expire: number;
}

export type NodeFilterType = (nodeConfig: PossibleNodeConfigType) => boolean;

export type NodeNameFilterType = (
  simpleNodeConfig: SimpleNodeConfig,
) => boolean;

export interface SortedNodeNameFilterType {
  readonly filter: <T>(
    nodeList: ReadonlyArray<T & SimpleNodeConfig>,
  ) => ReadonlyArray<T & SimpleNodeConfig>;
  readonly supportSort?: boolean;
}

export type PossibleNodeConfigType =
  | HttpsNodeConfig
  | HttpNodeConfig
  | ShadowsocksNodeConfig
  | ShadowsocksrNodeConfig
  | SnellNodeConfig
  | VmessNodeConfig
  | TrojanNodeConfig
  | Socks5NodeConfig
  | TuicNodeConfig
  | WireguardNodeConfig;
