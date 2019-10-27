import { cst } from 'yaml';

export enum NodeTypeEnum {
  HTTPS = 'https',
  Shadowsocks = 'shadowsocks',
  Shadowsocksr = 'shadowsocksr',
  Snell = 'snell',
  Vmess = 'vmess',
}

export enum SupportProviderEnum {
  BlackSSL = 'blackssl',
  ShadowsocksJsonSubscribe = 'shadowsocks_json_subscribe',
  V2rayNSubscribe = 'v2rayn_subscribe',
  ShadowsocksSubscribe = 'shadowsocks_subscribe',
  ShadowsocksrSubscribe = 'shadowsocksr_subscribe',
  Custom = 'custom',
}

export interface CommandConfig {
  readonly output: string;
  readonly artifacts: ReadonlyArray<ArtifactConfig>;
  readonly remoteSnippets?: ReadonlyArray<RemoteSnippetConfig>;
  readonly urlBase: string;
  readonly providerDir: string;
  readonly templateDir: string;
  readonly configDir: string;
  readonly upload?: {
    readonly prefix: string;
    readonly region: string;
    readonly bucket: string;
    readonly accessKeyId: string;
    readonly accessKeySecret: string;
  };
  readonly binPath?: {
    readonly shadowsocksr?: string;
    readonly v2ray?: string;
    vmess?: string; // tslint:disable-line
  };
  readonly surgeConfig?: {
    readonly v2ray: 'native'|'external';
  };
}

export interface RemoteSnippetConfig {
  readonly url: string;
  readonly name: string;
}

export interface RemoteSnippet extends RemoteSnippetConfig {
  readonly main: (rule: string) => string;
}

export interface ArtifactConfig {
  readonly name: string;
  readonly template: string;
  readonly provider: string;
  readonly combineProviders?: ReadonlyArray<string>;
  readonly customParams?: PlainObjectOf<string|boolean|number>;
  readonly proxyGroupModifier?: ProxyGroupModifier;
}

export interface ProviderConfig {
  readonly type: SupportProviderEnum;
  readonly nodeFilter?: NodeFilterType;
  readonly netflixFilter?: NodeNameFilterType;
  readonly youtubePremiumFilter?: NodeNameFilterType;
  readonly startPort?: number;
  readonly customFilters?: {
    readonly [name: string]: NodeNameFilterType;
  };
  readonly addFlag: boolean;
}

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
}

export interface V2rayNSubscribeProviderConfig extends ProviderConfig {
  readonly url: string;
}

export interface CustomProviderConfig extends ProviderConfig {
  readonly nodeList: ReadonlyArray<PossibleNodeConfigType>;
}

export interface HttpsNodeConfig extends SimpleNodeConfig {
  readonly type: NodeTypeEnum.HTTPS;
  readonly hostname: string;
  readonly port: number|string;
  readonly username: string;
  readonly password: string;
}

export interface ShadowsocksNodeConfig extends SimpleNodeConfig {
  readonly type: NodeTypeEnum.Shadowsocks;
  readonly hostname: string;
  readonly port: number|string;
  readonly method: string;
  readonly password: string;
  readonly 'udp-relay'?: 'true'|'false';
  readonly obfs?: 'tls'|'http';
  readonly 'obfs-host'?: string;
}

export interface SnellNodeConfig extends SimpleNodeConfig {
  readonly type: NodeTypeEnum.Snell;
  readonly hostname: string;
  readonly port: number|string;
  readonly psk: string;
  readonly obfs: string;
}

export interface ShadowsocksrNodeConfig extends SimpleNodeConfig {
  readonly type: NodeTypeEnum.Shadowsocksr;
  readonly hostname: string;
  readonly port: number|string;
  readonly method: string;
  readonly protocol: string;
  readonly obfs: string;
  readonly password: string;
  readonly obfsparam: string;
  readonly protoparam: string;
}

export interface VmessNodeConfig extends SimpleNodeConfig {
  readonly type: NodeTypeEnum.Vmess;
  readonly hostname: string;
  readonly port: number|string;
  readonly method: string;
  readonly uuid: string;
  readonly alterId: string;
  readonly network: 'tcp' | 'kcp' | 'ws' | 'http' ;
  readonly tls: boolean;
  readonly host: string;
  readonly path: string;
}

export interface SimpleNodeConfig {
  readonly type: NodeTypeEnum;
  readonly enable?: boolean;
  nodeName: string; // tslint:disable-line
  binPath?: string; // tslint:disable-line
  localPort?: number; // tslint:disable-line
  surgeConfig?: CommandConfig['surgeConfig']; // tslint:disable-line
}

export interface PlainObject { readonly [name: string]: any }
export interface PlainObjectOf<T> { readonly [name: string]: T }

export type NodeFilterType = (nodeConfig: PossibleNodeConfigType) => boolean;

export type NodeNameFilterType = (simpleNodeConfig: SimpleNodeConfig) => boolean;

export type PossibleNodeConfigType = HttpsNodeConfig|ShadowsocksNodeConfig|ShadowsocksrNodeConfig|SnellNodeConfig|VmessNodeConfig;

export type ProxyGroupModifier = (nodeList: ReadonlyArray<PossibleNodeConfigType>, filters: PlainObjectOf<NodeNameFilterType>) => ReadonlyArray<{
  readonly name: string;
  readonly type: 'select' | 'url-test';
  readonly proxies?: ReadonlyArray<string>;
  readonly filter?: NodeNameFilterType;
}>;
