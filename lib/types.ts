export enum NodeTypeEnum {
  HTTPS = 'https',
  Shadowsocks = 'shadowsocks',
  Shadowsocksr = 'shadowsocksr',
  Snell = 'snell',
}

export enum SupportProviderEnum {
  BlackSSL = 'blackssl',
  ShadowsocksJsonSubscribe = 'shadowsocks_json_subscribe',
  Custom = 'custom',
}

export interface CommandConfig {
  readonly output: string;
  readonly artifacts: ReadonlyArray<ArtifactConfig>;
  readonly urlBase: string;
  readonly providerDir: string;
  readonly templateDir: string;
  readonly upload: {
    readonly prefix: string;
    readonly region: string;
    readonly bucket?: string;
    readonly accessKeyId?: string;
    readonly accessKeySecret?: string;
  };
}

export interface ArtifactConfig {
  readonly name: string;
  readonly template: string;
  readonly provider: string;
  readonly recipe?: readonly string[];
  readonly customParams?: PlainObjectOf<string|boolean|number>;
  readonly proxyGroupModifier?: ProxyGroupModifier;
}

export interface ProviderConfig {
  readonly type: SupportProviderEnum;
  readonly nodeFilter?: NodeFilterType;
  readonly netflixFilter?: NodeNameFilterType;
  readonly youtubePremiumFilter?: NodeNameFilterType;
}

export interface BlackSSLProviderConfig extends ProviderConfig {
  readonly username: string;
  readonly password: string;
}

export interface ShadowsocksJsonSubscribeProviderConfig extends ProviderConfig {
  readonly url: string;
  readonly udpRelay?: boolean;
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
  readonly group: string;
}

export interface SimpleNodeConfig {
  readonly type: NodeTypeEnum;
  readonly enable?: boolean;
  readonly nodeName: string;
}

export interface PlainObject { readonly [name: string]: any }
export interface PlainObjectOf<T> { readonly [name: string]: T }

export type NodeFilterType = (nodeConfig: PossibleNodeConfigType) => boolean;

export type NodeNameFilterType = (simpleNodeConfig: SimpleNodeConfig) => boolean;

export type PossibleNodeConfigType = HttpsNodeConfig|ShadowsocksNodeConfig|ShadowsocksrNodeConfig|SnellNodeConfig;

export type ProxyGroupModifier = (nodeList: ReadonlyArray<PossibleNodeConfigType>, filters: PlainObjectOf<NodeNameFilterType>) => ReadonlyArray<{
  readonly name: string;
  readonly type: 'select' | 'url-test';
  readonly proxies?: ReadonlyArray<string>;
  readonly filter?: NodeNameFilterType;
}>;
