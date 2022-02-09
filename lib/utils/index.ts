import { createLogger } from '@surgio/logger';
import assert from 'assert';
import fs from 'fs-extra';
import _ from 'lodash';
import os from 'os';
import { join } from 'path';
import queryString from 'query-string';
import { JsonObject } from 'type-fest';
import { URL, URLSearchParams } from 'url';
import URLSafeBase64 from 'urlsafe-base64';
import YAML from 'yaml';
import net from 'net';

import {
  HttpNodeConfig,
  HttpsNodeConfig,
  NodeFilterType,
  NodeNameFilterType,
  NodeTypeEnum,
  PlainObjectOf,
  PossibleNodeConfigType,
  ProxyGroupModifier,
  ShadowsocksNodeConfig,
  ShadowsocksrNodeConfig,
  SimpleNodeConfig,
  SnellNodeConfig,
  SortedNodeNameFilterType,
  VmessNodeConfig,
} from '../types';
import { ConfigCache } from './cache';
import { ERR_INVALID_FILTER, OBFS_UA } from '../constant';
import { validateFilter } from './filter';
import httpClient from './http-client';
import { formatVmessUri } from './v2ray';

const logger = createLogger({ service: 'surgio:utils' });

export const getDownloadUrl = (
  baseUrl = '/',
  artifactName: string,
  inline = true,
  accessToken?: string,
): string => {
  let urlSearchParams: URLSearchParams;
  let name: string;

  if (artifactName.includes('?')) {
    urlSearchParams = new URLSearchParams(artifactName.split('?')[1]);
    name = artifactName.split('?')[0];
  } else {
    urlSearchParams = new URLSearchParams();
    name = artifactName;
  }

  if (accessToken) {
    urlSearchParams.set('access_token', accessToken);
  }
  if (!inline) {
    urlSearchParams.set('dl', '1');
  }

  const query = urlSearchParams.toString();

  return `${baseUrl}${name}${query ? '?' + query : ''}`;
};

export const getUrl = (
  baseUrl: string,
  path: string,
  accessToken?: string,
): string => {
  path = path.replace(/^\//, '');
  const url = new URL(path, baseUrl);
  if (accessToken) {
    url.searchParams.set('access_token', accessToken);
  }
  return url.toString();
};

export const getShadowsocksJSONConfig = async (
  url: string,
  udpRelay?: boolean,
): Promise<ReadonlyArray<ShadowsocksNodeConfig>> => {
  assert(url, '未指定订阅地址 url');

  async function requestConfigFromRemote(): Promise<
    ReadonlyArray<ShadowsocksNodeConfig>
  > {
    const response = ConfigCache.has(url)
      ? JSON.parse(ConfigCache.get(url) as string)
      : await (async () => {
          const res = await httpClient.get(url);

          ConfigCache.set(url, res.body);

          return JSON.parse(res.body);
        })();

    return (response.configs as ReadonlyArray<any>).map(
      (item): ShadowsocksNodeConfig => {
        const nodeConfig: any = {
          nodeName: item.remarks as string,
          type: NodeTypeEnum.Shadowsocks,
          hostname: item.server as string,
          port: item.server_port as string,
          method: item.method as string,
          password: item.password as string,
        };

        if (typeof udpRelay === 'boolean') {
          nodeConfig['udp-relay'] = udpRelay;
        }
        if (item.plugin === 'obfs-local') {
          const obfs = item.plugin_opts.match(/obfs=(\w+)/);
          const obfsHost = item.plugin_opts.match(/obfs-host=(.+)$/);

          if (obfs) {
            nodeConfig.obfs = obfs[1];
            nodeConfig['obfs-host'] = obfsHost ? obfsHost[1] : 'www.bing.com';
          }
        }

        return nodeConfig;
      },
    );
  }

  return await requestConfigFromRemote();
};

/**
 * @see https://manual.nssurge.com/policy/proxy.html
 */
export const getSurgeNodes = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeNameFilterType,
): string {
  // istanbul ignore next
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  const result: string[] = applyFilter(list, filter)
    .map((nodeConfig): string | undefined => {
      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          const config = nodeConfig as ShadowsocksNodeConfig;

          if (config.obfs && ['ws', 'wss'].includes(config.obfs)) {
            logger.warn(
              `不支持为 Surge 生成 v2ray-plugin 的 Shadowsocks 节点，节点 ${
                nodeConfig!.nodeName
              } 会被省略`,
            );
            return void 0;
          }

          // Native support for Shadowsocks
          if (nodeConfig?.surgeConfig?.shadowsocksFormat === 'ss') {
            return [
              config.nodeName,
              [
                'ss',
                config.hostname,
                config.port,
                'encrypt-method=' + config.method,
                ...pickAndFormatStringList(config, [
                  'password',
                  'udp-relay',
                  'obfs',
                  'obfs-host',
                  'tfo',
                  'mptcp',
                ]),
                ...(typeof config.testUrl === 'string'
                  ? [`test-url=${config.testUrl}`]
                  : []),
                ...(typeof config.underlyingProxy === 'string'
                  ? [`underlying-proxy=${config.underlyingProxy}`]
                  : []),
              ].join(', '),
            ].join(' = ');
          }

          // Using custom format
          return [
            config.nodeName,
            [
              'custom',
              config.hostname,
              config.port,
              config.method,
              config.password,
              'https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module',
              ...pickAndFormatStringList(config, [
                'udp-relay',
                'obfs',
                'obfs-host',
                'tfo',
                'mptcp',
              ]),
              ...(typeof config.testUrl === 'string'
                ? [`test-url=${config.testUrl}`]
                : []),
              ...(typeof config.underlyingProxy === 'string'
                ? [`underlying-proxy=${config.underlyingProxy}`]
                : []),
            ].join(', '),
          ].join(' = ');
        }

        case NodeTypeEnum.HTTPS: {
          const config = nodeConfig as HttpsNodeConfig;

          return [
            config.nodeName,
            [
              'https',
              config.hostname,
              config.port,
              config.username,
              config.password,
              ...(typeof config.skipCertVerify === 'boolean'
                ? [`skip-cert-verify=${config.skipCertVerify}`]
                : []),
              ...(typeof config.underlyingProxy === 'string'
                ? [`underlying-proxy=${config.underlyingProxy}`]
                : []),
              ...(typeof config.testUrl === 'string'
                ? [`test-url=${config.testUrl}`]
                : []),
              ...pickAndFormatStringList(config, [
                'sni',
                'tfo',
                'mptcp',
                'tls13',
              ]),
            ].join(', '),
          ].join(' = ');
        }

        case NodeTypeEnum.HTTP: {
          const config = nodeConfig as HttpNodeConfig;

          return [
            config.nodeName,
            [
              'http',
              config.hostname,
              config.port,
              config.username,
              config.password,
              ...(typeof config.underlyingProxy === 'string'
                ? [`underlying-proxy=${config.underlyingProxy}`]
                : []),
              ...(typeof config.testUrl === 'string'
                ? [`test-url=${config.testUrl}`]
                : []),
              ...pickAndFormatStringList(config, ['tfo', 'mptcp']),
            ].join(', '),
          ].join(' = ');
        }

        case NodeTypeEnum.Snell: {
          const config = nodeConfig as SnellNodeConfig;

          return [
            config.nodeName,
            [
              'snell',
              config.hostname,
              config.port,
              ...(typeof config.underlyingProxy === 'string'
                ? [`underlying-proxy=${config.underlyingProxy}`]
                : []),
              ...(typeof config.testUrl === 'string'
                ? [`test-url=${config.testUrl}`]
                : []),
              ...pickAndFormatStringList(config, [
                'psk',
                'obfs',
                'obfs-host',
                'version',
                'tfo',
                'mptcp',
              ]),
            ].join(', '),
          ].join(' = ');
        }

        case NodeTypeEnum.Shadowsocksr: {
          const config = nodeConfig as ShadowsocksrNodeConfig;

          // istanbul ignore next
          if (!config.binPath) {
            throw new Error(
              '请按照文档 http://url.royli.dev/vdGh2 添加 Shadowsocksr 二进制文件路径',
            );
          }

          const args = [
            '-s',
            config.hostname,
            '-p',
            `${config.port}`,
            '-m',
            config.method,
            '-o',
            config.obfs,
            '-O',
            config.protocol,
            '-k',
            config.password,
            '-l',
            `${config.localPort}`,
            '-b',
            '127.0.0.1',
          ];

          if (config.protoparam) {
            args.push('-G', config.protoparam);
          }
          if (config.obfsparam) {
            args.push('-g', config.obfsparam);
          }

          const configString = [
            'external',
            `exec = ${JSON.stringify(config.binPath)}`,
            ...args.map((arg) => `args = ${JSON.stringify(arg)}`),
            `local-port = ${config.localPort}`,
          ];

          if (config.localPort === 0) {
            throw new Error(
              `为 Surge 生成 SSR 配置时必须为 Provider ${config.provider?.name} 设置 startPort，参考 http://url.royli.dev/bWcpe`,
            );
          }

          if (config.hostnameIp && config.hostnameIp.length) {
            configString.push(
              ...config.hostnameIp.map((item) => `addresses = ${item}`),
            );
          }

          if (isIp(config.hostname)) {
            configString.push(`addresses = ${config.hostname}`);
          }

          return [config.nodeName, configString.join(', ')].join(' = ');
        }

        case NodeTypeEnum.Vmess: {
          const config = nodeConfig as VmessNodeConfig;

          if (nodeConfig?.surgeConfig?.v2ray === 'native') {
            // Native support for vmess

            const configList = [
              'vmess',
              config.hostname,
              config.port,
              `username=${config.uuid}`,
            ];

            if (
              ['chacha20-ietf-poly1305', 'aes-128-gcm'].includes(config.method)
            ) {
              configList.push(`encrypt-method=${config.method}`);
            }

            function getHeader(wsHeaders: Record<string, string>): string {
              return Object.keys(wsHeaders)
                .map((headerKey) => `${headerKey}:${wsHeaders[headerKey]}`)
                .join('|');
            }

            if (config.network && ['h2', 'grpc'].includes(config.network)) {
              logger.warn(
                `不支持为 Surge 生成 network: ${
                  config.network
                } 的 Vmess 节点，节点 ${nodeConfig!.nodeName} 会被省略`,
              );
              return void 0;
            }

            if (config.network === 'ws') {
              configList.push('ws=true');
              configList.push(`ws-path=${config.path}`);
              configList.push(
                'ws-headers=' +
                  JSON.stringify(
                    getHeader({
                      host: config.host || config.hostname,
                      'user-agent': OBFS_UA,
                      ..._.omit(config.wsHeaders, ['host']), // host 本质上是一个头信息，所以可能存在冲突的情况。以 host 属性为准。
                    }),
                  ),
              );
            }

            if (config.tls) {
              configList.push(
                'tls=true',
                ...(typeof config.tls13 === 'boolean'
                  ? [`tls13=${config.tls13}`]
                  : []),
                ...(typeof config.skipCertVerify === 'boolean'
                  ? [`skip-cert-verify=${config.skipCertVerify}`]
                  : []),
                ...(config.host ? [`sni=${config.host}`] : []),
              );
            }

            if (typeof config.tfo === 'boolean') {
              configList.push(`tfo=${config.tfo}`);
            }

            if (typeof config.mptcp === 'boolean') {
              configList.push(`mptcp=${config.mptcp}`);
            }

            if (config['underlyingProxy']) {
              configList.push(`underlying-proxy=${config['underlyingProxy']}`);
            }

            if (config['testUrl']) {
              configList.push(`test-url=${config['testUrl']}`);
            }

            if (nodeConfig?.surgeConfig?.vmessAEAD) {
              configList.push('vmess-aead=true');
            } else {
              configList.push('vmess-aead=false');
            }

            return [config.nodeName, configList.join(', ')].join(' = ');
          } else {
            // Using external provider

            // istanbul ignore next
            if (!config.binPath) {
              throw new Error(
                '请按照文档 http://url.royli.dev/vdGh2 添加 V2Ray 二进制文件路径',
              );
            }

            if (config.localPort === 0) {
              throw new Error(
                `为 Surge 生成 Vmess 配置时必须为 Provider ${config.provider?.name} 设置 startPort，参考 http://url.royli.dev/bWcpe`,
              );
            }

            const jsonFileName = `v2ray_${config.localPort}_${config.hostname}_${config.port}.json`;
            const jsonFilePath = join(ensureConfigFolder(), jsonFileName);
            const jsonFile = formatV2rayConfig(
              config.localPort as number,
              nodeConfig,
            );
            const args = [
              '--config',
              jsonFilePath.replace(os.homedir(), '$HOME'),
            ];
            const configString = [
              'external',
              `exec = ${JSON.stringify(config.binPath)}`,
              ...args.map((arg) => `args = ${JSON.stringify(arg)}`),
              `local-port = ${config.localPort}`,
            ];

            if (config.hostnameIp && config.hostnameIp.length) {
              configString.push(
                ...config.hostnameIp.map((item) => `addresses = ${item}`),
              );
            }

            if (isIp(config.hostname)) {
              configString.push(`addresses = ${config.hostname}`);
            }

            // istanbul ignore next
            if (process.env.NODE_ENV !== 'test') {
              fs.writeJSONSync(jsonFilePath, jsonFile);
            }

            return [config.nodeName, configString.join(', ')].join(' = ');
          }
        }

        case NodeTypeEnum.Trojan: {
          const configList: string[] = [
            'trojan',
            nodeConfig.hostname,
            `${nodeConfig.port}`,
            `password=${nodeConfig.password}`,
            ...pickAndFormatStringList(nodeConfig, [
              'tfo',
              'mptcp',
              'sni',
              'tls13',
            ]),
            ...(typeof nodeConfig.testUrl === 'string'
              ? [`test-url=${nodeConfig.testUrl}`]
              : []),
            ...(typeof nodeConfig.underlyingProxy === 'string'
              ? [`underlying-proxy=${nodeConfig.underlyingProxy}`]
              : []),
            ...(typeof nodeConfig.skipCertVerify === 'boolean'
              ? [`skip-cert-verify=${nodeConfig.skipCertVerify}`]
              : []),
          ];

          return [nodeConfig.nodeName, configList.join(', ')].join(' = ');
        }

        case NodeTypeEnum.Socks5: {
          const config = [
            nodeConfig.tls === true ? 'socks5-tls' : 'socks5',
            nodeConfig.hostname,
            nodeConfig.port,
            ...(typeof nodeConfig.underlyingProxy === 'string'
              ? [`underlying-proxy=${nodeConfig.underlyingProxy}`]
              : []),
            ...(typeof nodeConfig.testUrl === 'string'
              ? [`test-url=${nodeConfig.testUrl}`]
              : []),
            ...pickAndFormatStringList(nodeConfig, [
              'username',
              'password',
              'sni',
              'tfo',
              'mptcp',
              'tls13',
            ]),
          ];

          if (nodeConfig.tls === true) {
            config.push(
              ...(typeof nodeConfig.skipCertVerify === 'boolean'
                ? [`skip-cert-verify=${nodeConfig.skipCertVerify}`]
                : []),
              ...(typeof nodeConfig.clientCert === 'string'
                ? [`client-cert=${nodeConfig.clientCert}`]
                : []),
            );
          }

          return [nodeConfig.nodeName, config.join(', ')].join(' = ');
        }

        // istanbul ignore next
        default:
          logger.warn(
            `不支持为 Surge 生成 ${(nodeConfig as any).type} 的节点，节点 ${
              (nodeConfig as any).nodeName
            } 会被省略`,
          );
          return void 0;
      }
    })
    .filter((item): item is string => item !== undefined);

  return result.join('\n');
};

export const getClashNodes = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeNameFilterType,
): ReadonlyArray<any> {
  // istanbul ignore next
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  return applyFilter(list, filter)
    .map((nodeConfig) => {
      // istanbul ignore next
      if (nodeConfig.enable === false) {
        return null;
      }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks:
          return {
            type: 'ss',
            cipher: nodeConfig.method,
            name: nodeConfig.nodeName,
            password: nodeConfig.password,
            port: nodeConfig.port,
            server: nodeConfig.hostname,
            udp: nodeConfig['udp-relay'] === true,
            ...(nodeConfig.obfs && ['tls', 'http'].includes(nodeConfig.obfs)
              ? {
                  plugin: 'obfs',
                  'plugin-opts': {
                    mode: nodeConfig.obfs,
                    host: nodeConfig['obfs-host'],
                  },
                }
              : null),
            ...(nodeConfig.obfs && ['ws', 'wss'].includes(nodeConfig.obfs)
              ? {
                  plugin: 'v2ray-plugin',
                  'plugin-opts': {
                    mode: 'websocket',
                    tls: nodeConfig.obfs === 'wss',
                    ...(typeof nodeConfig.skipCertVerify === 'boolean' &&
                    nodeConfig.obfs === 'wss'
                      ? {
                          'skip-cert-verify': nodeConfig.skipCertVerify,
                        }
                      : null),
                    host: nodeConfig['obfs-host'],
                    path: nodeConfig['obfs-uri'] || '/',
                    mux:
                      typeof nodeConfig.mux === 'boolean'
                        ? nodeConfig.mux
                        : false,
                    headers: _.omit(nodeConfig.wsHeaders || {}, ['host']),
                  },
                }
              : null),
          };

        case NodeTypeEnum.Vmess:
          return {
            type: 'vmess',
            cipher: nodeConfig.method,
            name: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            port: nodeConfig.port,
            udp: nodeConfig['udp-relay'] === true,
            uuid: nodeConfig.uuid,
            alterId: nodeConfig.alterId,
            ...(nodeConfig.network === 'tcp'
              ? null
              : {
                  network: nodeConfig.network,
                }),
            tls: nodeConfig.tls,
            ...(typeof nodeConfig.skipCertVerify === 'boolean' && nodeConfig.tls
              ? {
                  'skip-cert-verify': nodeConfig.skipCertVerify,
                }
              : null),
            ...(nodeConfig.network === 'ws'
              ? {
                  'ws-opts': {
                    path: nodeConfig.protocolOpts
                      ? _.get(nodeConfig.protocolOpts, 'path', nodeConfig.path)
                      : nodeConfig.path,
                    headers: {
                      ...(nodeConfig.protocolOpts &&
                      'headers' in nodeConfig.protocolOpts
                        ? {
                            Host: _.get(
                              nodeConfig.protocolOpts.headers,
                              'Host',
                              null,
                            ),
                          }
                        : { Host: nodeConfig.host ? nodeConfig.host : null }),
                      ..._.omit(nodeConfig.wsHeaders, ['Host']),
                    },
                    ...(nodeConfig.protocolOpts
                      ? _.pick(nodeConfig.protocolOpts, [
                          'max-early-data',
                          'early-data-header-name',
                        ])
                      : null),
                  },
                  ...(nodeConfig.tls && nodeConfig.host
                    ? { servername: nodeConfig.host }
                    : null),
                }
              : null),
            ...(['h2', 'grpc'].includes(nodeConfig.network)
              ? {
                  [[nodeConfig.network, '-opts'].join('')]:
                    nodeConfig.protocolOpts,
                  ...(nodeConfig.tls && nodeConfig.host
                    ? { servername: nodeConfig.host }
                    : null),
                }
              : null),
          };

        case NodeTypeEnum.Shadowsocksr: {
          const ssrFormat = nodeConfig?.clashConfig?.ssrFormat;

          return {
            type: 'ssr',
            name: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            port: nodeConfig.port,
            password: nodeConfig.password,
            obfs: nodeConfig.obfs,
            protocol: nodeConfig.protocol,
            cipher: nodeConfig.method,
            ...(ssrFormat === 'native'
              ? {
                  'obfs-param': nodeConfig.obfsparam ?? '',
                  'protocol-param': nodeConfig.protoparam ?? '',
                }
              : {
                  obfsparam: nodeConfig.obfsparam ?? '',
                  protocolparam: nodeConfig.protoparam ?? '',
                }),
            udp: nodeConfig['udp-relay'] === true,
          };
        }

        case NodeTypeEnum.Snell:
          return {
            type: 'snell',
            name: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            port: nodeConfig.port,
            psk: nodeConfig.psk,
            'obfs-opts': {
              mode: nodeConfig.obfs,
              ...(nodeConfig['obfs-host']
                ? {
                    host: nodeConfig['obfs-host'],
                  }
                : null),
            },
            ...(nodeConfig.version
              ? {
                  version: nodeConfig.version,
                }
              : null),
          };

        case NodeTypeEnum.HTTPS:
          return {
            type: 'http',
            name: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            port: nodeConfig.port,
            username: nodeConfig.username /* istanbul ignore next */ || '',
            password: nodeConfig.password /* istanbul ignore next */ || '',
            tls: true,
            'skip-cert-verify': nodeConfig.skipCertVerify === true,
          };

        case NodeTypeEnum.HTTP:
          return {
            type: 'http',
            name: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            port: nodeConfig.port,
            username: nodeConfig.username /* istanbul ignore next */ || '',
            password: nodeConfig.password /* istanbul ignore next */ || '',
          };

        case NodeTypeEnum.Trojan:
          return {
            type: 'trojan',
            name: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            port: nodeConfig.port,
            password: nodeConfig.password,
            ...(nodeConfig['udp-relay']
              ? { udp: nodeConfig['udp-relay'] }
              : null),
            ...(nodeConfig.alpn ? { alpn: nodeConfig.alpn } : null),
            ...(nodeConfig.sni ? { sni: nodeConfig.sni } : null),
            'skip-cert-verify': nodeConfig.skipCertVerify === true,
          };

        case NodeTypeEnum.Socks5: {
          return {
            type: 'socks5',
            name: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            port: nodeConfig.port,
            ...(nodeConfig.username ? { username: nodeConfig.username } : null),
            ...(nodeConfig.password ? { password: nodeConfig.password } : null),
            ...(typeof nodeConfig.tls === 'boolean'
              ? { tls: nodeConfig.tls }
              : null),
            ...(typeof nodeConfig.skipCertVerify === 'boolean'
              ? { 'skip-cert-verify': nodeConfig.skipCertVerify }
              : null),
            ...(typeof nodeConfig.udpRelay === 'boolean'
              ? { udp: nodeConfig.udpRelay }
              : null),
          };
        }

        // istanbul ignore next
        default:
          logger.warn(
            `不支持为 Clash 生成 ${(nodeConfig as any).type} 的节点，节点 ${
              (nodeConfig as any).nodeName
            } 会被省略`,
          );
          return null;
      }
    })
    .filter((item) => item !== null);
};

export const getMellowNodes = function (
  list: ReadonlyArray<VmessNodeConfig | ShadowsocksNodeConfig>,
  filter?: NodeFilterType | SortedNodeNameFilterType,
): string {
  // istanbul ignore next
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  const result = applyFilter(list, filter)
    .map((nodeConfig) => {
      switch (nodeConfig.type) {
        case NodeTypeEnum.Vmess: {
          if (
            nodeConfig.network &&
            ['h2', 'grpc'].includes(nodeConfig.network)
          ) {
            logger.warn(
              `不支持为 Mellow 生成 network: ${
                nodeConfig.network
              } 的 Vmess 节点，节点 ${nodeConfig!.nodeName} 会被省略`,
            );
            return void 0;
          }

          const uri = formatVmessUri(nodeConfig, { isMellow: true });
          return [
            nodeConfig.nodeName,
            'vmess1',
            uri.trim().replace('vmess://', 'vmess1://'),
          ].join(', ');
        }

        case NodeTypeEnum.Shadowsocks: {
          const uri = getShadowsocksNodes([nodeConfig]);
          return [nodeConfig.nodeName, 'ss', uri.trim()].join(', ');
        }

        // istanbul ignore next
        default:
          logger.warn(
            `不支持为 Mellow 生成 ${(nodeConfig as any).type} 的节点，节点 ${
              (nodeConfig as any).nodeName
            } 会被省略`,
          );
          return null;
      }
    })
    .filter((item) => !!item);

  return result.join('\n');
};

// istanbul ignore next
export const toUrlSafeBase64 = (str: string): string =>
  URLSafeBase64.encode(Buffer.from(str, 'utf8'));

// istanbul ignore next
export const fromUrlSafeBase64 = (str: string): string => {
  if (URLSafeBase64.validate(str)) {
    return URLSafeBase64.decode(str).toString();
  }
  return fromBase64(str);
};

// istanbul ignore next
export const toBase64 = (str: string): string =>
  Buffer.from(str, 'utf8').toString('base64');

// istanbul ignore next
export const fromBase64 = (str: string): string =>
  Buffer.from(str, 'base64').toString('utf8');

/**
 * @see https://github.com/shadowsocks/shadowsocks-org/wiki/SIP002-URI-Scheme
 */
export const getShadowsocksNodes = (
  list: ReadonlyArray<ShadowsocksNodeConfig>,
  groupName = 'Surgio',
): string => {
  const result: ReadonlyArray<any> = list
    .map((nodeConfig) => {
      // istanbul ignore next
      if (nodeConfig.enable === false) {
        return null;
      }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          const config = _.cloneDeep(nodeConfig);
          const query: {
            readonly plugin?: string;
            readonly group?: string;
          } = {
            ...(config.obfs
              ? {
                  plugin: `${encodeURIComponent(
                    `obfs-local;obfs=${config.obfs};obfs-host=${config['obfs-host']}`,
                  )}`,
                }
              : null),
            ...(groupName ? { group: encodeURIComponent(groupName) } : null),
          };

          return [
            'ss://',
            toUrlSafeBase64(`${config.method}:${config.password}`),
            '@',
            config.hostname,
            ':',
            config.port,
            '/?',
            queryString.stringify(query, {
              encode: false,
              sort: false,
            }),
            '#',
            encodeURIComponent(config.nodeName),
          ].join('');
        }

        // istanbul ignore next
        default:
          logger.warn(
            `在生成 Shadowsocks 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`,
          );
          return null;
      }
    })
    .filter((item) => !!item);

  return result.join('\n');
};

export const getShadowsocksrNodes = (
  list: ReadonlyArray<ShadowsocksrNodeConfig>,
  groupName: string,
): string => {
  const result: ReadonlyArray<string | undefined> = list
    .map((nodeConfig) => {
      // istanbul ignore next
      if (nodeConfig.enable === false) {
        return void 0;
      }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocksr: {
          const baseUri = [
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.protocol,
            nodeConfig.method,
            nodeConfig.obfs,
            toUrlSafeBase64(nodeConfig.password),
          ].join(':');
          const query = {
            obfsparam: toUrlSafeBase64(nodeConfig.obfsparam),
            protoparam: toUrlSafeBase64(nodeConfig.protoparam),
            remarks: toUrlSafeBase64(nodeConfig.nodeName),
            group: toUrlSafeBase64(groupName),
            udpport: 0,
            uot: 0,
          };

          return (
            'ssr://' +
            toUrlSafeBase64(
              [
                baseUri,
                '/?',
                queryString.stringify(query, {
                  encode: false,
                }),
              ].join(''),
            )
          );
        }

        // istanbul ignore next
        default:
          logger.warn(
            `在生成 Shadowsocksr 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`,
          );
          return void 0;
      }
    })
    .filter((item) => item !== undefined);

  return result.join('\n');
};

export const getV2rayNNodes = (
  list: ReadonlyArray<VmessNodeConfig>,
): string => {
  const result: ReadonlyArray<string> = list
    .map((nodeConfig): string | undefined => {
      // istanbul ignore next
      if (nodeConfig.enable === false) {
        return void 0;
      }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Vmess: {
          const json = {
            v: '2',
            ps: nodeConfig.nodeName,
            add: nodeConfig.hostname,
            port: `${nodeConfig.port}`,
            id: nodeConfig.uuid,
            aid: nodeConfig.alterId,
            net: nodeConfig.network,
            type: 'none',
            host: nodeConfig.host,
            path: nodeConfig.path,
            tls: nodeConfig.tls ? 'tls' : '',
          };

          return 'vmess://' + toBase64(JSON.stringify(json));
        }

        // istanbul ignore next
        default:
          logger.warn(
            `在生成 V2Ray 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`,
          );
          return void 0;
      }
    })
    .filter((item): item is string => item !== undefined);

  return result.join('\n');
};

export const getQuantumultNodes = function (
  list: ReadonlyArray<
    | ShadowsocksNodeConfig
    | VmessNodeConfig
    | ShadowsocksrNodeConfig
    | HttpsNodeConfig
  >,
  groupName = 'Surgio',
  filter?: NodeNameFilterType | SortedNodeNameFilterType,
): string {
  // istanbul ignore next
  if (arguments.length === 3 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  function getHeader(wsHeaders: Record<string, string>): string {
    return Object.keys(wsHeaders)
      .map((headerKey) => `${headerKey}:${wsHeaders[headerKey]}`)
      .join('[Rr][Nn]');
  }

  const result: ReadonlyArray<string> = applyFilter(list, filter)
    .map((nodeConfig): string | undefined => {
      switch (nodeConfig.type) {
        case NodeTypeEnum.Vmess: {
          if (
            nodeConfig.network &&
            ['h2', 'grpc'].includes(nodeConfig.network)
          ) {
            logger.warn(
              `不支持为 Quantumult 生成 network: ${
                nodeConfig.network
              } 的 Vmess 节点，节点 ${nodeConfig!.nodeName} 会被省略`,
            );
            return void 0;
          }

          const config = [
            'vmess',
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.method === 'auto'
              ? 'chacha20-ietf-poly1305'
              : nodeConfig.method,
            JSON.stringify(nodeConfig.uuid),
            nodeConfig.alterId,
            `group=${groupName}`,
            `over-tls=${nodeConfig.tls === true ? 'true' : 'false'}`,
            `certificate=1`,
            `obfs=${nodeConfig.network}`,
            `obfs-path=${JSON.stringify(nodeConfig.path || '/')}`,
            `obfs-header=${JSON.stringify(
              getHeader({
                host: nodeConfig.host || nodeConfig.hostname,
                'user-agent': OBFS_UA, // 需要用 "" 包裹否则 Surge 会无法解析
                ..._.omit(nodeConfig.wsHeaders, ['host']),
              }),
            )}`,
          ]
            .filter((value) => !!value)
            .join(',');

          return (
            'vmess://' + toBase64([nodeConfig.nodeName, config].join(' = '))
          );
        }

        case NodeTypeEnum.Shadowsocks: {
          return getShadowsocksNodes([nodeConfig], groupName);
        }

        case NodeTypeEnum.Shadowsocksr:
          return getShadowsocksrNodes([nodeConfig], groupName);

        case NodeTypeEnum.HTTPS: {
          const config = [
            nodeConfig.nodeName,
            [
              'http',
              `upstream-proxy-address=${nodeConfig.hostname}`,
              `upstream-proxy-port=${nodeConfig.port}`,
              'upstream-proxy-auth=true',
              `upstream-proxy-username=${nodeConfig.username}`,
              `upstream-proxy-password=${nodeConfig.password}`,
              'over-tls=true',
              'certificate=1',
            ].join(', '),
          ].join(' = ');

          return 'http://' + toBase64(config);
        }

        // istanbul ignore next
        default:
          logger.warn(
            `不支持为 Quantumult 生成 ${
              (nodeConfig as any).type
            } 的节点，节点 ${(nodeConfig as any).nodeName} 会被省略`,
          );
          return void 0;
      }
    })
    .filter((item): item is string => item !== undefined);

  return result.join('\n');
};

/**
 * @see https://github.com/crossutility/Quantumult-X/blob/master/sample.conf
 */
export const getQuantumultXNodes = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeNameFilterType | SortedNodeNameFilterType,
): string {
  // istanbul ignore next
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  const result: ReadonlyArray<string> = applyFilter(list, filter)
    .map((nodeConfig): string | undefined => {
      switch (nodeConfig.type) {
        case NodeTypeEnum.Vmess: {
          const config = [
            `${nodeConfig.hostname}:${nodeConfig.port}`,
            // method 为 auto 时 qx 会无法识别
            nodeConfig.method === 'auto'
              ? `method=chacha20-ietf-poly1305`
              : `method=${nodeConfig.method}`,
            `password=${nodeConfig.uuid}`,
            ...(nodeConfig['udp-relay'] ? ['udp-relay=true'] : []),
            ...(nodeConfig.tfo ? ['fast-open=true'] : []),
            ...(nodeConfig.quantumultXConfig?.vmessAEAD
              ? ['aead=true']
              : ['aead=false']),
          ];

          if (
            nodeConfig.network &&
            ['h2', 'grpc'].includes(nodeConfig.network)
          ) {
            logger.warn(
              `不支持为 Quantumult X 生成 network: ${
                nodeConfig.network
              } 的 Vmess 节点，节点 ${nodeConfig!.nodeName} 会被省略`,
            );
            return void 0;
          }

          switch (nodeConfig.network) {
            case 'ws':
              if (nodeConfig.tls) {
                config.push(`obfs=wss`);
              } else {
                config.push(`obfs=ws`);
              }
              config.push(`obfs-uri=${nodeConfig.path || '/'}`);
              config.push(
                `obfs-host=${nodeConfig.host || nodeConfig.hostname}`,
              );
              // istanbul ignore next
              if (nodeConfig.tls13) {
                config.push(`tls13=true`);
              }

              break;
            case 'tcp':
              if (nodeConfig.tls) {
                config.push(`obfs=over-tls`);
              }
              // istanbul ignore next
              if (nodeConfig.tls13) {
                config.push(`tls13=true`);
              }

              break;
            default:
            // do nothing
          }

          config.push(`tag=${nodeConfig.nodeName}`);

          // istanbul ignore next
          if (
            nodeConfig.wsHeaders &&
            Object.keys(nodeConfig.wsHeaders).length > 1
          ) {
            logger.warn(
              `Quantumult X 不支持自定义额外的 Header 字段，节点 ${nodeConfig.nodeName} 可能不可用`,
            );
          }

          return `vmess=${config.join(', ')}`;
        }

        case NodeTypeEnum.Shadowsocks: {
          const config = [
            `${nodeConfig.hostname}:${nodeConfig.port}`,
            ...pickAndFormatStringList(nodeConfig, ['method', 'password']),
            ...(nodeConfig.obfs && ['http', 'tls'].includes(nodeConfig.obfs)
              ? [
                  `obfs=${nodeConfig.obfs}`,
                  `obfs-host=${nodeConfig['obfs-host']}`,
                ]
              : []),
            ...(nodeConfig.obfs && ['ws', 'wss'].includes(nodeConfig.obfs)
              ? [
                  `obfs=${nodeConfig.obfs}`,
                  `obfs-host=${nodeConfig['obfs-host'] || nodeConfig.hostname}`,
                  `obfs-uri=${nodeConfig['obfs-uri'] || '/'}`,
                ]
              : []),
            ...(nodeConfig['udp-relay'] ? [`udp-relay=true`] : []),
            ...(nodeConfig.tfo ? [`fast-open=${nodeConfig.tfo}`] : []),
            ...(nodeConfig.tls13 ? [`tls13=${nodeConfig.tls13}`] : []),
            `tag=${nodeConfig.nodeName}`,
          ].join(', ');

          // istanbul ignore next
          if (
            nodeConfig.wsHeaders &&
            Object.keys(nodeConfig.wsHeaders).length > 1
          ) {
            logger.warn(
              `Quantumult X 不支持自定义额外的 Header 字段，节点 ${nodeConfig.nodeName} 可能不可用`,
            );
          }

          return `shadowsocks=${config}`;
        }

        case NodeTypeEnum.Shadowsocksr: {
          const config = [
            `${nodeConfig.hostname}:${nodeConfig.port}`,
            ...pickAndFormatStringList(nodeConfig, ['method', 'password']),
            `ssr-protocol=${nodeConfig.protocol}`,
            `ssr-protocol-param=${nodeConfig.protoparam}`,
            `obfs=${nodeConfig.obfs}`,
            `obfs-host=${nodeConfig.obfsparam}`,
            ...(nodeConfig['udp-relay'] ? [`udp-relay=true`] : []),
            ...(nodeConfig.tfo ? [`fast-open=${nodeConfig.tfo}`] : []),
            `tag=${nodeConfig.nodeName}`,
          ].join(', ');

          return `shadowsocks=${config}`;
        }

        case NodeTypeEnum.HTTP:
        case NodeTypeEnum.HTTPS: {
          const config = [
            `${nodeConfig.hostname}:${nodeConfig.port}`,
            ...pickAndFormatStringList(nodeConfig, ['username', 'password']),
            ...(nodeConfig.tfo ? [`fast-open=${nodeConfig.tfo}`] : []),
          ];

          if (nodeConfig.type === NodeTypeEnum.HTTPS) {
            config.push(
              'over-tls=true',
              `tls-verification=${nodeConfig.skipCertVerify !== true}`,
              ...(nodeConfig.tls13 ? [`tls13=${nodeConfig.tls13}`] : []),
            );
          }

          config.push(`tag=${nodeConfig.nodeName}`);

          return `http=${config.join(', ')}`;
        }

        case NodeTypeEnum.Trojan: {
          const config = [
            `${nodeConfig.hostname}:${nodeConfig.port}`,
            ...pickAndFormatStringList(nodeConfig, ['password']),
            'over-tls=true',
            `tls-verification=${nodeConfig.skipCertVerify !== true}`,
            ...(nodeConfig.sni ? [`tls-host=${nodeConfig.sni}`] : []),
            ...(nodeConfig.tfo ? [`fast-open=${nodeConfig.tfo}`] : []),
            ...(nodeConfig['udp-relay'] ? [`udp-relay=true`] : []),
            ...(nodeConfig.tls13 ? [`tls13=${nodeConfig.tls13}`] : []),
            `tag=${nodeConfig.nodeName}`,
          ];

          return `trojan=${config.join(', ')}`;
        }

        // istanbul ignore next
        default:
          logger.warn(
            `不支持为 QuantumultX 生成 ${
              (nodeConfig as any).type
            } 的节点，节点 ${(nodeConfig as any).nodeName} 会被省略`,
          );
          return void 0;
      }
    })
    .filter((item): item is string => item !== undefined);

  return result.join('\n');
};

// istanbul ignore next
export const getShadowsocksNodesJSON = (
  list: ReadonlyArray<ShadowsocksNodeConfig>,
): string => {
  const nodes: ReadonlyArray<any> = list
    .map((nodeConfig) => {
      // istanbul ignore next
      if (nodeConfig.enable === false) {
        return null;
      }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          const useObfs = Boolean(nodeConfig.obfs && nodeConfig['obfs-host']);
          return {
            remarks: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            server_port: nodeConfig.port,
            method: nodeConfig.method,
            remarks_base64: toUrlSafeBase64(nodeConfig.nodeName),
            password: nodeConfig.password,
            tcp_over_udp: false,
            udp_over_tcp: false,
            enable: true,
            ...(useObfs
              ? {
                  plugin: 'obfs-local',
                  'plugin-opts': `obfs=${nodeConfig.obfs};obfs-host=${nodeConfig['obfs-host']}`,
                }
              : null),
          };
        }

        // istanbul ignore next
        default:
          logger.warn(
            `在生成 Shadowsocks 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`,
          );
          return undefined;
      }
    })
    .filter((item) => item !== undefined);

  return JSON.stringify(nodes, null, 2);
};

export const getNodeNames = function (
  list: ReadonlyArray<SimpleNodeConfig>,
  filter?: NodeNameFilterType | SortedNodeNameFilterType,
  separator?: string,
): string {
  // istanbul ignore next
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  return applyFilter(list, filter)
    .map((item) => item.nodeName)
    .join(separator || ', ');
};

export const getClashNodeNames = function (
  list: ReadonlyArray<SimpleNodeConfig>,
  filter?: NodeNameFilterType | SortedNodeNameFilterType,
  existingProxies?: ReadonlyArray<string>,
): ReadonlyArray<string> {
  // istanbul ignore next
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  let result: string[] = [];

  if (existingProxies) {
    result = result.concat(existingProxies);
  }

  result = result.concat(
    applyFilter(list, filter).map((item) => item.nodeName),
  );

  return result;
};

export const generateClashProxyGroup = (
  ruleName: string,
  ruleType: 'select' | 'url-test' | 'fallback' | 'load-balance',
  nodeNameList: ReadonlyArray<SimpleNodeConfig>,
  options: {
    readonly filter?: NodeNameFilterType | SortedNodeNameFilterType;
    readonly existingProxies?: ReadonlyArray<string>;
    readonly proxyTestUrl?: string;
    readonly proxyTestInterval?: number;
  },
): {
  readonly type: string;
  readonly name: string;
  readonly proxies: readonly string[];
  readonly url?: string;
  readonly interval?: number;
} => {
  let proxies;

  if (options.existingProxies) {
    if (options.filter) {
      const nodes = applyFilter(nodeNameList, options.filter);
      proxies = ([] as string[]).concat(
        options.existingProxies,
        nodes.map((item) => item.nodeName),
      );
    } else {
      proxies = options.existingProxies;
    }
  } else {
    const nodes = applyFilter(nodeNameList, options.filter);
    proxies = nodes.map((item) => item.nodeName);
  }

  return {
    type: ruleType,
    name: ruleName,
    proxies,
    ...(['url-test', 'fallback', 'load-balance'].includes(ruleType)
      ? {
          url: options.proxyTestUrl,
          interval: options.proxyTestInterval,
        }
      : null),
  };
};

export const toYaml = (obj: JsonObject): string => YAML.stringify(obj);

export const pickAndFormatStringList = (
  obj: any,
  keyList: readonly string[],
): readonly string[] => {
  const result: string[] = [];
  keyList.forEach((key) => {
    if (obj.hasOwnProperty(key)) {
      result.push(`${key}=${obj[key]}`);
    }
  });
  return result;
};

export const decodeStringList = <T = Record<string, string | boolean>>(
  stringList: ReadonlyArray<string>,
): T => {
  const result = {};
  stringList.forEach((item) => {
    if (item.includes('=')) {
      const match = item.match(/^(.*?)=(.*?)$/);
      if (match) {
        result[match[1].trim()] = match[2].trim() || true;
      }
    } else {
      result[item.trim()] = true;
    }
  });
  return result as T;
};

export const normalizeClashProxyGroupConfig = (
  nodeList: ReadonlyArray<PossibleNodeConfigType>,
  customFilters: PlainObjectOf<NodeNameFilterType | SortedNodeNameFilterType>,
  proxyGroupModifier: ProxyGroupModifier,
  options: {
    readonly proxyTestUrl?: string;
    readonly proxyTestInterval?: number;
  } = {},
): ReadonlyArray<any> => {
  const proxyGroup = proxyGroupModifier(nodeList, customFilters);

  return proxyGroup.map((item) => {
    if (item.hasOwnProperty('filter')) {
      // istanbul ignore next
      if (!item.filter || !validateFilter(item.filter)) {
        throw new Error(
          `过滤器 ${item.filter} 无效，请检查 proxyGroupModifier`,
        );
      }

      return generateClashProxyGroup(item.name, item.type, nodeList, {
        filter: item.filter,
        existingProxies: item.proxies,
        proxyTestUrl: options.proxyTestUrl,
        proxyTestInterval: options.proxyTestInterval,
      });
    } else {
      return generateClashProxyGroup(item.name, item.type, nodeList, {
        existingProxies: item.proxies,
        proxyTestUrl: options.proxyTestUrl,
        proxyTestInterval: options.proxyTestInterval,
      });
    }
  });
};

export const ensureConfigFolder = (dir: string = os.homedir()): string => {
  let baseDir;

  try {
    fs.accessSync(dir, fs.constants.W_OK);
    baseDir = dir;
  } catch (err) {
    // if the user do not have write permission
    // istanbul ignore next
    baseDir = '/tmp';
  }

  const configDir = join(baseDir, '.config/surgio');
  fs.mkdirpSync(configDir);
  return configDir;
};

export const formatV2rayConfig = (
  localPort: number,
  nodeConfig: VmessNodeConfig,
): JsonObject => {
  const config: any = {
    log: {
      loglevel: 'warning',
    },
    inbound: {
      port: Number(localPort),
      listen: '127.0.0.1',
      protocol: 'socks',
      settings: {
        auth: 'noauth',
      },
    },
    outbound: {
      protocol: 'vmess',
      settings: {
        vnext: [
          {
            address: nodeConfig.hostname,
            port: Number(nodeConfig.port),
            users: [
              {
                id: nodeConfig.uuid,
                alterId: Number(nodeConfig.alterId),
                security: nodeConfig.method,
                level: 0,
              },
            ],
          },
        ],
      },
      streamSettings: {
        security: 'none',
      },
    },
  };

  if (nodeConfig.tls) {
    config.outbound.streamSettings = {
      ...config.outbound.streamSettings,
      security: 'tls',
      tlsSettings: {
        serverName: nodeConfig.host || nodeConfig.hostname,
        ...(typeof nodeConfig.skipCertVerify === 'boolean'
          ? {
              allowInsecure: nodeConfig.skipCertVerify,
            }
          : null),
        ...(typeof nodeConfig.tls13 === 'boolean'
          ? {
              allowInsecureCiphers: !nodeConfig.tls13,
            }
          : null),
      },
    };
  }

  if (nodeConfig.network === 'ws') {
    config.outbound.streamSettings = {
      ...config.outbound.streamSettings,
      network: nodeConfig.network,
      wsSettings: {
        path: nodeConfig.path,
        headers: {
          Host: nodeConfig.host,
          'User-Agent': OBFS_UA,
        },
      },
    };
  }

  return config;
};

export const applyFilter = <T extends SimpleNodeConfig>(
  nodeList: ReadonlyArray<T>,
  filter?: NodeNameFilterType | SortedNodeNameFilterType,
): ReadonlyArray<T> => {
  // istanbul ignore next
  if (filter && !validateFilter(filter)) {
    throw new Error(`使用了无效的过滤器 ${filter}`);
  }

  let nodes: ReadonlyArray<T> = nodeList.filter((item) => {
    const result = item.enable !== false;

    if (filter && typeof filter === 'function') {
      return filter(item) && result;
    }

    return result;
  });

  if (
    filter &&
    typeof filter === 'object' &&
    typeof filter.filter === 'function'
  ) {
    nodes = filter.filter(nodes);
  }

  return nodes;
};

export const lowercaseHeaderKeys = (
  headers: Record<string, string>,
): Record<string, string> => {
  const wsHeaders = {};

  Object.keys(headers).forEach((key) => {
    wsHeaders[key.toLowerCase()] = headers[key];
  });

  return wsHeaders;
};

// istanbul ignore next
export const isIp = (str: string): boolean =>
  net.isIPv4(str) || net.isIPv6(str);

// istanbul ignore next
export const isNow = (): boolean =>
  typeof process.env.NOW_REGION !== 'undefined' ||
  typeof process.env.VERCEL_REGION !== 'undefined';

// istanbul ignore next
export const isVercel = (): boolean => isNow();

// istanbul ignore next
export const isHeroku = (): boolean => typeof process.env.DYNO !== 'undefined';

// istanbul ignore next
export const isGitHubActions = (): boolean =>
  typeof process.env.GITHUB_ACTIONS !== 'undefined';

// istanbul ignore next
export const isGitLabCI = (): boolean =>
  typeof process.env.GITLAB_CI !== 'undefined';

// istanbul ignore next
export const isPkgBundle = (): boolean => __dirname.startsWith('/snapshot');

// istanbul ignore next
export const isRailway = (): boolean =>
  typeof process.env.RAILWAY_STATIC_URL !== 'undefined';
