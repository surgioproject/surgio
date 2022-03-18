import { createLogger } from '@surgio/logger';
import fs from 'fs-extra';
import _ from 'lodash';
import os from 'os';
import { join } from 'path';
import { ERR_INVALID_FILTER, OBFS_UA } from '../constant';
import {
  HttpNodeConfig,
  HttpsNodeConfig,
  NodeFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  ShadowsocksNodeConfig,
  ShadowsocksrNodeConfig,
  SnellNodeConfig,
  SortedNodeNameFilterType,
  VmessNodeConfig,
} from '../types';
import {
  applyFilter,
  ensureConfigFolder,
  formatV2rayConfig,
  isIp,
  pickAndFormatStringList,
} from './index';

const logger = createLogger({ service: 'surgio:utils:surge' });

export const getSurgeExtendHeaders = (
  wsHeaders: Record<string, string>,
): string => {
  return Object.keys(wsHeaders)
    .map((headerKey) => `${headerKey}:${wsHeaders[headerKey]}`)
    .join('|');
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

            if (config.network === 'ws') {
              configList.push('ws=true');
              configList.push(`ws-path=${config.path}`);
              configList.push(
                'ws-headers=' +
                  JSON.stringify(
                    getSurgeExtendHeaders({
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

          if (nodeConfig.network === 'ws') {
            configList.push('ws=true');
            configList.push(`ws-path=${nodeConfig.wsPath}`);

            if (nodeConfig.wsHeaders) {
              configList.push(
                'ws-headers=' +
                  JSON.stringify(getSurgeExtendHeaders(nodeConfig.wsHeaders)),
              );
            }
          }

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
