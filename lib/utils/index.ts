import { createLogger } from '@surgio/logger';
import assert from 'assert';
import fs from 'fs-extra';
import got from 'got';
import _ from 'lodash';
import os from 'os';
import path from 'path';
import queryString from 'query-string';
import { JsonObject } from 'type-fest';
import { default as legacyUrl } from 'url';
import URLSafeBase64 from 'urlsafe-base64';
import YAML from 'yaml';

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
  TrojanNodeConfig,
  VmessNodeConfig,
} from '../types';
import { ConfigCache } from './cache';
import { ERR_INVALID_FILTER, NETWORK_TIMEOUT, OBFS_UA, PROXY_TEST_INTERVAL, PROXY_TEST_URL } from './constant';
import { isIp } from './dns';
import { validateFilter } from './filter';
import { formatVmessUri } from './v2ray';

const logger = createLogger({ service: 'surgio:utils' });

// istanbul ignore next
export const resolveRoot = (...args: readonly string[]): string =>
  path.join(__dirname, '../../', ...args);

export const getDownloadUrl = (baseUrl: string = '/', artifactName: string, inline: boolean = true, accessToken?: string): string => {
  const urlObject = legacyUrl.parse(`${baseUrl}${artifactName}`, true);

  if (accessToken) {
    urlObject.query.access_token = accessToken;
  }

  if (!inline) {
    urlObject.query.dl = '1';
  }

  // tslint:disable-next-line:no-delete
  delete urlObject.search;

  return legacyUrl.format(urlObject);
};

// istanbul ignore next
export const getBlackSSLConfig = async (username: string, password: string): Promise<ReadonlyArray<HttpsNodeConfig>> => {
  assert(username, 'Lack of BlackSSL username.');
  assert(password, 'Lack of BlackSSL password.');

  const key = `blackssl_${username}`;

  async function requestConfigFromBlackSSL(): Promise<ReadonlyArray<HttpsNodeConfig>> {
    const response = ConfigCache.has(key) ? JSON.parse(ConfigCache.get(key)) : await (async () => {
      const res = await got
        .get('https://api.darkssl.com/v1/service/ssl_info', {
          responseType: 'text',
          searchParams: {
            username,
            password,
          },
          timeout: NETWORK_TIMEOUT,
          headers: {
            'User-Agent': 'GoAgentX/774 CFNetwork/901.1 Darwin/17.6.0 (x86_64)',
          },
        });

      ConfigCache.set(key, res.body);

      return JSON.parse(res.body);
    })();

    return (response.ssl_nodes as readonly any[]).map<HttpsNodeConfig>(item => ({
      nodeName: item.name,
      type: NodeTypeEnum.HTTPS,
      hostname: item.server,
      port: item.port,
      username,
      password,
    }));
  }

  return await requestConfigFromBlackSSL();
};

export const getShadowsocksJSONConfig = async (
  url: string,
  udpRelay?: boolean,
): Promise<ReadonlyArray<ShadowsocksNodeConfig>> => {
  assert(url, '未指定订阅地址 url');

  async function requestConfigFromRemote(): Promise<ReadonlyArray<ShadowsocksNodeConfig>> {
    const response = ConfigCache.has(url) ? JSON.parse(ConfigCache.get(url)) : await (async () => {
      const res = await got.get(url, {
        timeout: NETWORK_TIMEOUT,
      });

      ConfigCache.set(url, res.body);

      return JSON.parse(res.body);
    })();

    return (response.configs as readonly any[]).map<ShadowsocksNodeConfig>(item => {
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
    });
  }

  return await requestConfigFromRemote();
};

export const getSurgeNodes = function(
  list: ReadonlyArray<HttpsNodeConfig|HttpNodeConfig|ShadowsocksNodeConfig|SnellNodeConfig|ShadowsocksrNodeConfig|VmessNodeConfig|TrojanNodeConfig>,
  filter?: NodeFilterType|SortedNodeNameFilterType,
): string {
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  const result: string[] = applyFilter(list, filter)
    .map<string>(nodeConfig => {
      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          const config = nodeConfig as ShadowsocksNodeConfig;

          if (['ws', 'wss'].includes(config.obfs)) {
            logger.warn(`不支持为 Surge 生成 v2ray-plugin 的 Shadowsocks 节点，节点 ${nodeConfig!.nodeName} 会被省略`);
            return null;
          }

          // Native support for Shadowsocks
          if (nodeConfig?.surgeConfig?.shadowsocksFormat === 'ss') {
            return ([
              config.nodeName,
              [
                'ss',
                config.hostname,
                config.port,
                'encrypt-method=' + config.method,
                ...pickAndFormatStringList(config, ['password', 'udp-relay', 'obfs', 'obfs-host', 'tfo']),
                ...(typeof config.mptcp === 'boolean' ? [
                  `mptcp=${config.mptcp}`,
                ] : []),
              ].join(', ')
            ].join(' = '));
          }

          // Using external provider
          return ([
            config.nodeName,
            [
              'custom',
              config.hostname,
              config.port,
              config.method,
              config.password,
              'https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module',
              ...pickAndFormatStringList(config, ['udp-relay', 'obfs', 'obfs-host', 'tfo']),
              ...(typeof config.mptcp === 'boolean' ? [
                `mptcp=${config.mptcp}`,
              ] : []),
            ].join(', ')
          ].join(' = '));
        }

        case NodeTypeEnum.HTTPS: {
          const config = nodeConfig as HttpsNodeConfig;

          return ([
            config.nodeName,
            [
              'https',
              config.hostname,
              config.port,
              config.username,
              config.password,
              ...(typeof config.tls13 === 'boolean' ? [
                `tls13=${config.tls13}`,
              ] : []),
              ...(typeof config.skipCertVerify === 'boolean' ? [
                `skip-cert-verify=${config.skipCertVerify}`,
              ] : []),
              ...(typeof config.tfo === 'boolean' ? [
                `tfo=${config.tfo}`,
              ] : []),
              ...(typeof config.mptcp === 'boolean' ? [
                `mptcp=${config.mptcp}`,
              ] : []),
            ].join(', ')
          ].join(' = '));
        }

        case NodeTypeEnum.HTTP: {
          const config = nodeConfig as HttpNodeConfig;

          return ([
            config.nodeName,
            [
              'http',
              config.hostname,
              config.port,
              config.username,
              config.password,
            ].join(', ')
          ].join(' = '));
        }

        case NodeTypeEnum.Snell: {
          const config = nodeConfig as SnellNodeConfig;

          return ([
            config.nodeName,
            [
              'snell',
              config.hostname,
              config.port,
              ...pickAndFormatStringList(config, ['psk', 'obfs', 'obfs-host', 'version']),
              ...(typeof config.tfo === 'boolean' ? [
                `tfo=${config.tfo}`,
              ] : []),
              ...(typeof config.mptcp === 'boolean' ? [
                `mptcp=${config.mptcp}`,
              ] : []),
            ].join(', '),
          ].join(' = '));
        }

        case NodeTypeEnum.Shadowsocksr: {
          const config = nodeConfig as ShadowsocksrNodeConfig;

          // istanbul ignore next
          if (!config.binPath) {
            throw new Error('You must specify a binary file path for Shadowsocksr.');
          }

          const args = [
            '-s', config.hostname,
            '-p', `${config.port}`,
            '-m', config.method,
            '-o', config.obfs,
            '-O', config.protocol,
            '-k', config.password,
            '-l', `${config.localPort}`,
            '-b', '127.0.0.1',
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
            ...(args.map(arg => `args = ${JSON.stringify(arg)}`)),
            `local-port = ${config.localPort}`,
          ];

          if (config.hostnameIp) {
            configString.push(...config.hostnameIp.map(item => `addresses = ${item}`));
          }

          if (isIp(config.hostname)) {
            configString.push(`addresses = ${config.hostname}`);
          }

          return ([
            config.nodeName,
            configString.join(', '),
          ].join(' = '));
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

            function getHeader(
              wsHeaders: Record<string, string>,
            ): string {
              return Object.keys(wsHeaders)
                .map(headerKey => `${headerKey}:${wsHeaders[headerKey]}`)
                .join('|');
            }

            if (config.network === 'ws') {
              configList.push('ws=true');
              configList.push(`ws-path=${config.path}`);
              configList.push(
                'ws-headers=' + JSON.stringify(
                  getHeader({
                    host: config.host || config.hostname,
                    'user-agent': OBFS_UA,
                    ..._.omit(config.wsHeaders, ['host']),
                  })
                )
              );
            }

            if (config.tls) {
              configList.push(
                  'tls=true',
                  ...(typeof config.tls13 === 'boolean' ? [
                    `tls13=${config.tls13}`,
                  ] : []),
                  ...(typeof config.skipCertVerify === 'boolean' ? [
                    `skip-cert-verify=${config.skipCertVerify}`,
                  ] : []),
              );
            }

            if (typeof config.tfo === 'boolean') {
              configList.push(`tfo=${config.tfo}`);
            }

            if (typeof config.mptcp === 'boolean') {
              configList.push(`mptcp=${config.mptcp}`);
            }

            return ([
              config.nodeName,
              configList.join(', '),
            ].join(' = '));
          } else {
            // Using external provider

            // istanbul ignore next
            if (!config.binPath) {
              throw new Error('You must specify a binary file path for V2Ray.');
            }

            const jsonFileName = `v2ray_${config.localPort}_${config.hostname}_${config.port}.json`;
            const jsonFilePath = path.join(ensureConfigFolder(), jsonFileName);
            const jsonFile = formatV2rayConfig(config.localPort, nodeConfig);
            const args = [
              '--config', jsonFilePath.replace(os.homedir(), '$HOME'),
            ];
            const configString = [
              'external',
              `exec = ${JSON.stringify(config.binPath)}`,
              ...(args.map(arg => `args = ${JSON.stringify(arg)}`)),
              `local-port = ${config.localPort}`,
            ];

            if (config.hostnameIp) {
              configString.push(...config.hostnameIp.map(item => `addresses = ${item}`));
            }

            if (isIp(config.hostname)) {
              configString.push(`addresses = ${config.hostname}`);
            }

            // istanbul ignore next
            if (process.env.NODE_ENV !== 'test') {
              fs.writeJSONSync(jsonFilePath, jsonFile);
            }

            return ([
              config.nodeName,
              configString.join(', '),
            ].join(' = '));
          }
        }

        case NodeTypeEnum.Trojan: {
          const configList: string[] = [
            'trojan',
            nodeConfig.hostname,
            `${nodeConfig.port}`,
            `password=${nodeConfig.password}`,
            ...(typeof nodeConfig.tfo === 'boolean' ? [
              `tfo=${nodeConfig.tfo}`,
            ] : []),
            ...(typeof nodeConfig.mptcp === 'boolean' ? [
              `mptcp=${nodeConfig.mptcp}`,
            ] : []),
          ];

          return (
            [
              nodeConfig.nodeName,
              configList.join(', ')
            ]
          ).join(' = ');
        }

        // istanbul ignore next
        default:
          logger.warn(`不支持为 Surge 生成 ${nodeConfig!.type} 的节点，节点 ${nodeConfig!.nodeName} 会被省略`);
          return null;
      }
    })
    .filter(item => item !== null);

  return result.join('\n');
};

export const getClashNodes = function(
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType|SortedNodeNameFilterType,
): ReadonlyArray<any> {
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  return applyFilter(list, filter)
    .map(nodeConfig => {
      if (nodeConfig.enable === false) { return null; }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks:
          return {
            type: 'ss',
            cipher: nodeConfig.method,
            name: nodeConfig.nodeName,
            password: nodeConfig.password,
            port: nodeConfig.port,
            server: nodeConfig.hostname,
            udp: nodeConfig['udp-relay'] || false,
            ...(['tls', 'http'].includes(nodeConfig.obfs) ? {
              plugin: 'obfs',
              'plugin-opts': {
                mode: nodeConfig.obfs,
                host: nodeConfig['obfs-host'],
              },
            } : null),
            ...(['ws', 'wss'].includes(nodeConfig.obfs) ? {
              plugin: 'v2ray-plugin',
              'plugin-opts': {
                mode: 'websocket',
                tls: nodeConfig.obfs === 'wss',
                ...(typeof nodeConfig.skipCertVerify === 'boolean' && nodeConfig.obfs === 'wss' ? {
                  'skip-cert-verify': nodeConfig.skipCertVerify,
                } : null),
                host: nodeConfig['obfs-host'],
                path: nodeConfig['obfs-uri'] || '/',
                mux: false,
                headers: nodeConfig.wsHeaders || {},
              },
            } : null),
          };

        case NodeTypeEnum.Vmess:
          return {
            type: 'vmess',
            cipher: nodeConfig.method,
            name: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            port: nodeConfig.port,
            uuid: nodeConfig.uuid,
            alterId: nodeConfig.alterId,
            ...(nodeConfig.network === 'tcp' ? null : {
              network: nodeConfig.network,
            }),
            tls: nodeConfig.tls,
            ...(typeof nodeConfig.skipCertVerify === 'boolean' && nodeConfig.tls ? {
              'skip-cert-verify': nodeConfig.skipCertVerify,
            } : null),
            ...(nodeConfig.network === 'ws' ? {
              'ws-path': nodeConfig.path,
              'ws-headers': {
                ...(nodeConfig.host ? { host: nodeConfig.host } : null),
                ...nodeConfig.wsHeaders,
              },
            } : null),
          };

        case NodeTypeEnum.Shadowsocksr:
          return {
            type: 'ssr',
            name: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            port: nodeConfig.port,
            password: nodeConfig.password,
            obfs: nodeConfig.obfs,
            obfsparam: nodeConfig.obfsparam,
            protocol: nodeConfig.protocol,
            protocolparam: nodeConfig.protoparam,
            cipher: nodeConfig.method,
          };

        case NodeTypeEnum.Snell:
          return {
            type: 'snell',
            name: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            port: nodeConfig.port,
            psk: nodeConfig.psk,
            'obfs-opts': {
              mode: nodeConfig.obfs,
              ...(nodeConfig['obfs-host'] ? {
                host: nodeConfig['obfs-host'],
              } : null),
              ...(nodeConfig.version ? {
                host: nodeConfig.version,
              } : null),
            },
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
            skipCertVerify: nodeConfig.skipCertVerify === true,
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

        // istanbul ignore next
        default:
          logger.warn(`不支持为 Clash 生成 ${nodeConfig!.type} 的节点，节点 ${nodeConfig!.nodeName} 会被省略`);
          return null;
      }
    })
    .filter(item => item !== null);
};

export const getMellowNodes = function(
  list: ReadonlyArray<VmessNodeConfig|ShadowsocksNodeConfig>,
  filter?: NodeFilterType|SortedNodeNameFilterType
): string {
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  const result = applyFilter(list, filter)
    .map(nodeConfig => {
      switch (nodeConfig.type) {
        case NodeTypeEnum.Vmess: {
          const uri = formatVmessUri(nodeConfig);
          return [nodeConfig.nodeName, 'vmess1', uri.trim().replace('vmess://', 'vmess1://')].join(', ');
        }

        case NodeTypeEnum.Shadowsocks: {
          const uri = getShadowsocksNodes([nodeConfig]);
          return [nodeConfig.nodeName, 'ss', uri.trim()].join(', ');
        }

        // istanbul ignore next
        default:
            logger.warn(`不支持为 Mellow 生成 ${nodeConfig!.type} 的节点，节点 ${nodeConfig!.nodeName} 会被省略`);
          return null;
      }
    })
    .filter(item => !!item);

  return result.join('\n');
};

// istanbul ignore next
export const toUrlSafeBase64 = (str: string): string => URLSafeBase64.encode(Buffer.from(str, 'utf8'));

// istanbul ignore next
export const fromUrlSafeBase64 = (str: string): string => {
  if (URLSafeBase64.validate(str)) {
    return URLSafeBase64.decode(str).toString();
  }
  return fromBase64(str);
};

// istanbul ignore next
export const toBase64 = (str: string): string => Buffer.from(str, 'utf8').toString('base64');

// istanbul ignore next
export const fromBase64 = (str: string): string => Buffer.from(str, 'base64').toString('utf8');

/**
 * @see https://github.com/shadowsocks/shadowsocks-org/wiki/SIP002-URI-Scheme
 */
export const getShadowsocksNodes = (
  list: ReadonlyArray<ShadowsocksNodeConfig>,
  groupName: string = 'Surgio'
): string => {
  const result: ReadonlyArray<any> = list
    .map(nodeConfig => {
      if (nodeConfig.enable === false) { return null; }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          const config = _.cloneDeep(nodeConfig);
          const query: {
            readonly plugin?: string;
            readonly group?: string;
          } = {
            ...(config.obfs ? {
              plugin: `${encodeURIComponent(`obfs-local;obfs=${config.obfs};obfs-host=${config['obfs-host']}`)}`,
            } : null),
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
          logger.warn(`在生成 Shadowsocks 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`);
          return null;
      }
    })
    .filter(item => !!item);

  return result.join('\n');
};

export const getShadowsocksrNodes = (list: ReadonlyArray<ShadowsocksrNodeConfig>, groupName: string): string => {
  const result: ReadonlyArray<string> = list
    .map(nodeConfig => {
      if (nodeConfig.enable === false) { return null; }

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

          return 'ssr://' + toUrlSafeBase64([
            baseUri,
            '/?',
            queryString.stringify(query, {
              encode: false,
            }),
          ].join(''));
        }

        // istanbul ignore next
        default:
          logger.warn(`在生成 Shadowsocksr 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`);
          return null;
      }
    })
    .filter(item => item !== null);

  return result.join('\n');
};

export const getV2rayNNodes = (list: ReadonlyArray<VmessNodeConfig>): string => {
  const result: ReadonlyArray<string> = list
    .map<string>(nodeConfig => {
      if (nodeConfig.enable === false) { return null; }

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
          logger.warn(`在生成 V2Ray 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`);
          return null;
      }
    })
    .filter(item => !!item);

  return result.join('\n');
};

export const getQuantumultNodes = function(
  list: ReadonlyArray<ShadowsocksNodeConfig|VmessNodeConfig|ShadowsocksrNodeConfig|HttpsNodeConfig>,
  groupName: string = 'Surgio',
  filter?: NodeNameFilterType|SortedNodeNameFilterType,
): string {
  if (arguments.length === 3 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  function getHeader(
    wsHeaders: Record<string, string>
  ): string {
    return Object.keys(wsHeaders)
      .map(headerKey => `${headerKey}:${wsHeaders[headerKey]}`)
      .join('[Rr][Nn]');
  }

  const result: ReadonlyArray<string> = applyFilter(list, filter)
    .map<string>(nodeConfig => {
      switch (nodeConfig.type) {
        case NodeTypeEnum.Vmess: {
          const config = [
            'vmess', nodeConfig.hostname, nodeConfig.port,
            (nodeConfig.method === 'auto' ? 'chacha20-ietf-poly1305' : nodeConfig.method),
            JSON.stringify(nodeConfig.uuid), nodeConfig.alterId,
            `group=${groupName}`,
            `over-tls=${nodeConfig.tls === true ? 'true' : 'false'}`,
            `certificate=1`,
            `obfs=${nodeConfig.network}`,
            `obfs-path=${JSON.stringify(nodeConfig.path || '/')}`,
            `obfs-header=${JSON.stringify(getHeader({
              host: nodeConfig.host || nodeConfig.hostname,
              'user-agent': OBFS_UA, // 需要用 "" 包裹否则 Surge 会无法解析
              ..._.omit(nodeConfig.wsHeaders, ['host'])
            }))}`,
          ].filter(value => !!value).join(',');

          return 'vmess://' + toBase64([
            nodeConfig.nodeName,
            config,
          ].join(' = '));
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
              'certificate=1'
            ].join(', ')
          ].join(' = ');

          return 'http://' + toBase64(config);
        }

        // istanbul ignore next
        default:
          logger.warn(`不支持为 Quantumult 生成 ${nodeConfig!.type} 的节点，节点 ${nodeConfig!.nodeName} 会被省略`);
          return null;
      }
    })
    .filter(item => !!item);

  return result.join('\n');
};

/**
 * @see https://github.com/crossutility/Quantumult-X/blob/master/sample.conf
 */
export const getQuantumultXNodes = function(
  list: ReadonlyArray<ShadowsocksNodeConfig|VmessNodeConfig|ShadowsocksrNodeConfig|HttpsNodeConfig|HttpNodeConfig>,
  filter?: NodeNameFilterType|SortedNodeNameFilterType,
): string {
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  const result: ReadonlyArray<string> = applyFilter(list, filter)
    .map<string>(nodeConfig => {
      switch (nodeConfig.type) {
        case NodeTypeEnum.Vmess: {
          const config = [
            `${nodeConfig.hostname}:${nodeConfig.port}`,
            // method 为 auto 时 qx 会无法识别
            (nodeConfig.method === 'auto' ?
              `method=chacha20-ietf-poly1305` :
              `method=${nodeConfig.method}`),
            `password=${nodeConfig.uuid}`,
            'udp-relay=true',
            ...(nodeConfig.tfo ? [
              `fast-open=${nodeConfig.tfo}`,
            ] : []),
          ];

          switch (nodeConfig.network) {
            case 'ws':
              if (nodeConfig.tls) {
                config.push(`obfs=wss`);
              } else {
                config.push(`obfs=ws`);
              }
              config.push(`obfs-uri=${nodeConfig.path || '/'}`);
              config.push(`obfs-host=${nodeConfig.host || nodeConfig.hostname}`);

              break;
            case 'tcp':
              if (nodeConfig.tls) {
                config.push(`obfs=over-tls`);
              }

              break;
            default:
              // do nothing
          }

          config.push(`tag=${nodeConfig.nodeName}`);

          // istanbul-ignore-next
          if (nodeConfig.wsHeaders && Object.keys(nodeConfig.wsHeaders).length > 1) {
            logger.warn(`Quantumult X 不支持自定义额外的 Header 字段，节点 ${nodeConfig.nodeName} 可能不可用`);
          }

          return `vmess=${config.join(', ')}`;
        }

        case NodeTypeEnum.Shadowsocks: {
          const config = [
            `${nodeConfig.hostname}:${nodeConfig.port}`,
            ...pickAndFormatStringList(nodeConfig, ['method', 'password']),
            ...(['http', 'tls'].includes(nodeConfig.obfs) ? [
              `obfs=${nodeConfig.obfs}`,
              `obfs-host=${nodeConfig['obfs-host']}`,
            ] : []),
            ...(['ws', 'wss'].includes(nodeConfig.obfs) ? [
              `obfs=${nodeConfig.obfs}`,
              `obfs-host=${nodeConfig['obfs-host'] || nodeConfig.hostname}`,
              `obfs-uri=${nodeConfig['obfs-uri'] || '/'}`,
            ] : []),
            ...(nodeConfig['udp-relay'] ? [
              `udp-relay=${nodeConfig['udp-relay']}`,
            ] : []),
            ...(nodeConfig.tfo ? [
              `fast-open=${nodeConfig.tfo}`,
            ] : []),
            `tag=${nodeConfig.nodeName}`,
          ]
            .join(', ');

          // istanbul-ignore-next
          if (nodeConfig.wsHeaders && Object.keys(nodeConfig.wsHeaders).length > 1) {
            logger.warn(`Quantumult X 不支持自定义额外的 Header 字段，节点 ${nodeConfig.nodeName} 可能不可用`);
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
            ...(nodeConfig['udp-relay'] ? [
              `udp-relay=${nodeConfig['udp-relay']}`,
            ] : []),
            ...(nodeConfig.tfo ? [
              `fast-open=${nodeConfig.tfo}`,
            ] : []),
            `tag=${nodeConfig.nodeName}`,
          ]
            .join(', ');

          return `shadowsocks=${config}`;
        }

        case NodeTypeEnum.HTTP:
        case NodeTypeEnum.HTTPS: {
          const config = [
            `${nodeConfig.hostname}:${nodeConfig.port}`,
            ...pickAndFormatStringList(nodeConfig, ['username', 'password']),
            ...(nodeConfig.tfo ? [
              `fast-open=${nodeConfig.tfo}`,
            ] : []),
          ];

          if (nodeConfig.type === NodeTypeEnum.HTTPS) {
            config.push(
              'over-tls=true',
              `tls-verification=${nodeConfig.skipCertVerify !== true}`
            );
          }

          config.push(`tag=${nodeConfig.nodeName}`);

          return `http=${config.join(', ')}`;
        }

        // istanbul ignore next
        default:
          logger.warn(`不支持为 QuantumultX 生成 ${nodeConfig!.type} 的节点，节点 ${nodeConfig!.nodeName} 会被省略`);
          return null;
      }
    })
    .filter(item => !!item);

  return result.join('\n');
};

// istanbul ignore next
export const getShadowsocksNodesJSON = (list: ReadonlyArray<ShadowsocksNodeConfig>): string => {
  const nodes: ReadonlyArray<object> = list
    .map(nodeConfig => {
      if (nodeConfig.enable === false) { return null; }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          const useObfs: boolean = Boolean(nodeConfig.obfs && nodeConfig['obfs-host']);
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
            ...(useObfs ? {
              plugin: 'obfs-local',
              'plugin-opts': `obfs=${nodeConfig.obfs};obfs-host=${nodeConfig['obfs-host']}`
            } : null)
          };
        }

        // istanbul ignore next
        default:
          logger.warn(`在生成 Shadowsocks 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`);
          return null;
      }
    })
    .filter(item => item !== null);

  return JSON.stringify(nodes, null, 2);
};

export const getNodeNames = function(
  list: ReadonlyArray<SimpleNodeConfig>,
  filter?: NodeNameFilterType|SortedNodeNameFilterType,
  separator?: string,
): string {
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  return applyFilter(list, filter).map(item => item.nodeName).join(separator || ', ');
};

export const getClashNodeNames = function(
  list: ReadonlyArray<SimpleNodeConfig>,
  filter?: NodeNameFilterType|SortedNodeNameFilterType,
  existingProxies?: ReadonlyArray<string>,
): ReadonlyArray<string> {
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  let result: string[] = [];

  if (existingProxies) {
    result = result.concat(existingProxies);
  }

  result = result.concat(applyFilter(list, filter).map(item => item.nodeName));

  return result;
};

export const generateClashProxyGroup = (
  ruleName: string,
  ruleType: 'select'|'url-test'|'fallback'|'load-balance',
  nodeNameList: ReadonlyArray<SimpleNodeConfig>,
  options: {
    readonly filter?: NodeNameFilterType|SortedNodeNameFilterType,
    readonly existingProxies?: ReadonlyArray<string>,
    readonly proxyTestUrl?: string,
    readonly proxyTestInterval?: number,
  } = {
    proxyTestUrl: PROXY_TEST_URL,
    proxyTestInterval: PROXY_TEST_INTERVAL,
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
      proxies = [].concat(options.existingProxies, nodes.map(item => item.nodeName));
    } else {
      proxies = options.existingProxies;
    }
  } else {
    const nodes = applyFilter(nodeNameList, options.filter);
    proxies = nodes.map(item => item.nodeName);
  }

  return {
    type: ruleType,
    name: ruleName,
    proxies,
    ...(['url-test', 'fallback', 'load-balance'].includes(ruleType) ? {
      url: options.proxyTestUrl,
      interval: options.proxyTestInterval,
    } : null),
  };
};

export const toYaml = (obj: JsonObject): string => YAML.stringify(obj);

export const pickAndFormatStringList = (obj: object, keyList: readonly string[]): readonly string[] => {
  const result: string[] = [];
  keyList.forEach(key => {
    if (obj.hasOwnProperty(key)) {
      result.push(`${key}=${obj[key]}`);
    }
  });
  return result;
};

export const decodeStringList = <T = Record<string, string|boolean>>(stringList: ReadonlyArray<string>): T => {
  const result = {};
  stringList.forEach(item => {
    const pair = item.split('=');
    result[pair[0]] = pair[1] || true;
  });
  return result as T;
};

export const normalizeClashProxyGroupConfig = (
  nodeList: ReadonlyArray<PossibleNodeConfigType>,
  customFilters: PlainObjectOf<NodeNameFilterType|SortedNodeNameFilterType>,
  proxyGroupModifier: ProxyGroupModifier,
  options: {
    readonly proxyTestUrl?: string,
    readonly proxyTestInterval?: number,
  } = {},
): ReadonlyArray<any> => {
  const proxyGroup = proxyGroupModifier(nodeList, customFilters);

  return proxyGroup.map<any>(item => {
    if (item.hasOwnProperty('filter')) {
      // istanbul ignore next
      if (!item.filter || !validateFilter(item.filter)) {
        throw new Error(`过滤器 ${item.filter} 无效，请检查 proxyGroupModifier`);
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
    // can't write
    baseDir = '/tmp';
  }

  const configDir = path.join(baseDir, '.config/surgio');
  fs.mkdirpSync(configDir);
  return configDir;
};

export const formatV2rayConfig = (localPort: string|number, nodeConfig: VmessNodeConfig): JsonObject => {
  const config: any = {
    log: {
      loglevel: 'warning'
    },
    inbound: {
      port: Number(localPort),
      listen: '127.0.0.1',
      protocol: 'socks',
      settings: {
        auth: 'noauth',
      }
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
              }
            ]
          }
        ]
      },
      streamSettings: {
        security: 'none',
      },
    }
  };

  if (nodeConfig.tls) {
    config.outbound.streamSettings = {
      ...config.outbound.streamSettings,
      security: 'tls',
      tlsSettings: {
        serverName: nodeConfig.host || nodeConfig.hostname,
        ...(typeof nodeConfig.skipCertVerify === 'boolean' ? {
          allowInsecure: nodeConfig.skipCertVerify,
        } : null),
        ...(typeof nodeConfig.tls13 === 'boolean' ? {
          allowInsecureCiphers: !nodeConfig.tls13,
        } : null),
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
  filter?: NodeNameFilterType|SortedNodeNameFilterType
): ReadonlyArray<T> => {
  if (filter && !validateFilter(filter)) {
    throw new Error(`使用了无效的过滤器 ${filter}`);
  }

  let nodes: ReadonlyArray<T> = nodeList.filter(item => {
    const result = item.enable !== false;

    if (filter && typeof filter === 'function') {
      return filter(item) && result;
    }

    return result;
  });

  if (filter && typeof filter === 'object' && typeof filter.filter === 'function') {
    nodes = filter.filter(nodes);
  }

  return nodes;
};

export const lowercaseHeaderKeys = (headers: Record<string, string>) => {
  const wsHeaders = {};

  Object.keys(headers)
    .forEach(key => {
      wsHeaders[key.toLowerCase()] = headers[key];
    });

  return wsHeaders;
};
