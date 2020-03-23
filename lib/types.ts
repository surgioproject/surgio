import Provider from './provider/Provider';

export enum NodeTypeEnum {
  HTTPS = 'https',
  HTTP = 'http',
  Shadowsocks = 'shadowsocks',
  Shadowsocksr = 'shadowsocksr',
  Snell = 'snell',
  Vmess = 'vmess',
  Trojan = 'trojan',
  Socks5 = 'socks5',
}

export enum SupportProviderEnum {
  Clash = 'clash',
  Custom = 'custom',
  ShadowsocksSubscribe = 'shadowsocks_subscribe',
  ShadowsocksrSubscribe = 'shadowsocksr_subscribe',
  ShadowsocksJsonSubscribe = 'shadowsocks_json_subscribe',
  V2rayNSubscribe = 'v2rayn_subscribe',
  BlackSSL = 'blackssl',
}

export interface CommandConfig {
  readonly output: string;
  readonly artifacts: ReadonlyArray<ArtifactConfig>;
  readonly remoteSnippets?: ReadonlyArray<RemoteSnippetConfig>;
  readonly urlBase: string;
  publicUrl: string; // tslint:disable-line:readonly-keyword
  readonly providerDir: string;
  readonly templateDir: string;
  readonly configDir: string;
  readonly analytics?: boolean;
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
    vmess?: string; // tslint:disable-line:readonly-keyword
  };
  readonly surgeConfig?: {
    readonly shadowsocksFormat?: 'ss'|'custom';
    readonly v2ray?: 'native'|'external';
    readonly resolveHostname?: boolean;
  };
  readonly quantumultXConfig?: {
    readonly deviceIds?: ReadonlyArray<string>;
  };
  readonly gateway?: {
    readonly accessToken?: string;
    readonly auth?: boolean; // tslint:disable-line:readonly-keyword
    readonly cookieMaxAge?: number;
  },
  readonly proxyTestUrl?: string;
  readonly proxyTestInterval?: number;
  readonly customFilters?: {
    readonly [name: string]: NodeNameFilterType|SortedNodeNameFilterType;
  };
}

export interface RemoteSnippetConfig {
  readonly url: string;
  readonly name: string;
}

export interface RemoteSnippet extends RemoteSnippetConfig {
  readonly main: (rule: string) => string;
  readonly text: string;
}

export interface ArtifactConfig {
  readonly name: string;
  readonly template: string;
  readonly provider: string;
  readonly combineProviders?: ReadonlyArray<string>;
  readonly categories?: ReadonlyArray<string>;
  readonly customParams?: PlainObjectOf<string|boolean|number>;
  readonly proxyGroupModifier?: ProxyGroupModifier;
  readonly destDir?: string;
  readonly templateString?: string;
}

export interface ProviderConfig {
  readonly type: SupportProviderEnum;
  readonly nodeFilter?: NodeFilterType|SortedNodeNameFilterType;
  readonly netflixFilter?: NodeNameFilterType|SortedNodeNameFilterType;
  readonly youtubePremiumFilter?: NodeNameFilterType|SortedNodeNameFilterType;
  readonly startPort?: number;
  readonly customFilters?: {
    readonly [name: string]: NodeNameFilterType|SortedNodeNameFilterType;
  };
  readonly addFlag?: boolean;
  readonly tfo?: boolean;
  readonly mptcp?: boolean;
  readonly renameNode?: (name: string) => string;
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
  readonly udpRelay?: boolean;
}

export interface V2rayNSubscribeProviderConfig extends ProviderConfig {
  readonly url: string;
}

export interface ClashProviderConfig extends ProviderConfig {
  readonly url: string;
  readonly udpRelay?: boolean;
}

export interface CustomProviderConfig extends ProviderConfig {
  readonly nodeList: ReadonlyArray<any>;
}

export interface HttpNodeConfig extends SimpleNodeConfig {
  readonly type: NodeTypeEnum.HTTP;
  readonly hostname: string;
  readonly port: number|string;
  readonly username: string;
  readonly password: string;
}

export interface HttpsNodeConfig extends SimpleNodeConfig {
  readonly type: NodeTypeEnum.HTTPS;
  readonly hostname: string;
  readonly port: number|string;
  readonly username: string;
  readonly password: string;
  readonly tls13?: boolean;
  readonly skipCertVerify?: boolean;
}

export interface ShadowsocksNodeConfig extends SimpleNodeConfig {
  readonly type: NodeTypeEnum.Shadowsocks;
  readonly hostname: string;
  readonly port: number|string;
  readonly method: string;
  readonly password: string;
  readonly 'udp-relay'?: boolean;
  readonly obfs?: 'tls'|'http'|'ws'|'wss';
  readonly 'obfs-host'?: string;
  readonly 'obfs-uri'?: string;
  readonly skipCertVerify?: boolean;
  readonly wsHeaders?: Record<string, string>;
}

export interface SnellNodeConfig extends SimpleNodeConfig {
  readonly type: NodeTypeEnum.Snell;
  readonly hostname: string;
  readonly port: number|string;
  readonly psk: string;
  readonly obfs: string;
  readonly 'obfs-host'?: string;
  readonly version?: string;
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
  readonly 'udp-relay'?: boolean;
}

export interface VmessNodeConfig extends SimpleNodeConfig {
  readonly type: NodeTypeEnum.Vmess;
  readonly hostname: string;
  readonly port: number|string;
  readonly method: 'auto'|'aes-128-gcm'|'chacha20-ietf-poly1305'|'none';
  readonly uuid: string;
  readonly alterId: string;
  readonly network: 'tcp'|'ws';
  readonly tls: boolean;
  readonly host?: string;
  readonly path?: string;
  readonly udp?: boolean; // TODO: 统一为 udp-relay
  readonly tls13?: boolean;
  readonly skipCertVerify?: boolean;
  readonly wsHeaders?: Record<string, string>;
}

export interface TrojanNodeConfig extends SimpleNodeConfig {
  readonly type: NodeTypeEnum.Trojan;
  readonly hostname: string;
  readonly port: number|string;
  readonly password: string;
  readonly skipCertVerify?: boolean;
  readonly alpn?: ReadonlyArray<string>;
  readonly sni?: string;
  readonly 'udp-relay'?: boolean;
}

export interface Socks5NodeConfig extends SimpleNodeConfig {
  readonly type: NodeTypeEnum.Socks5;
  readonly hostname: string;
  readonly port: number|string;
  readonly username?: string;
  readonly password?: string;
  readonly tls?: boolean;
  readonly skipCertVerify?: boolean;
  readonly udp?: boolean;
  readonly sni?: string;
  readonly clientCert?: string;
}

export interface SimpleNodeConfig {
  readonly type: NodeTypeEnum;
  nodeName: string; // tslint:disable-line
  readonly enable?: boolean;
  // tslint:disable-next-line
  tfo?: boolean; // TCP Fast Open
  // tslint:disable-next-line
  mptcp?: boolean; // Multi-Path TCP
  binPath?: string; // tslint:disable-line
  localPort?: number; // tslint:disable-line
  surgeConfig?: CommandConfig['surgeConfig']; // tslint:disable-line
  hostnameIp?: ReadonlyArray<string>; // tslint:disable-line
  provider?: Provider; // tslint:disable-line
}

export interface PlainObject { readonly [name: string]: any }
export interface PlainObjectOf<T> { readonly [name: string]: T }

export interface CreateServerOptions {
  readonly cwd?: string;
}

export interface SubscriptionUserinfo {
  readonly upload: number;
  readonly download: number;
  readonly total: number;
  readonly expire: number;
}

export type NodeFilterType = (nodeConfig: PossibleNodeConfigType) => boolean;

export type NodeNameFilterType = (simpleNodeConfig: SimpleNodeConfig) => boolean;

export interface SortedNodeNameFilterType {
  readonly filter: <T>(nodeList: ReadonlyArray<T & SimpleNodeConfig>) => ReadonlyArray<T & SimpleNodeConfig>;
  readonly supportSort?: boolean;
}

export type PossibleNodeConfigType = HttpsNodeConfig|HttpNodeConfig|ShadowsocksNodeConfig|ShadowsocksrNodeConfig|SnellNodeConfig|VmessNodeConfig|TrojanNodeConfig|Socks5NodeConfig;

export type ProxyGroupModifier = (nodeList: ReadonlyArray<PossibleNodeConfigType>, filters: PlainObjectOf<NodeNameFilterType|SortedNodeNameFilterType>) => ReadonlyArray<{
  readonly name: string;
  readonly type: 'select'|'url-test'|'fallback'|'load-balance';
  readonly proxies?: ReadonlyArray<string>;
  readonly filter?: NodeNameFilterType;
}>;
