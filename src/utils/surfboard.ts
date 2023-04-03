import { createLogger } from '@surgio/logger';
import _ from 'lodash';
import { ERR_INVALID_FILTER, OBFS_UA } from '../constant';
import {
  HttpNodeConfig,
  HttpsNodeConfig,
  NodeFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  ShadowsocksNodeConfig,
  SortedNodeNameFilterType,
  VmessNodeConfig,
} from '../types';
import { pickAndFormatStringList } from './index';
import { applyFilter } from './filter';

const logger = createLogger({ service: 'surgio:utils:surfboard' });

export const getSurfboardExtendHeaders = (
  wsHeaders: Record<string, string>,
): string => {
  return Object.keys(wsHeaders)
    .map((headerKey) => `${headerKey}:${wsHeaders[headerKey]}`)
    .join('|');
};

/**
 * @see https://manual.nssurge.com/policy/proxy.html
 */
export const getSurfboardNodes = function (
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
              `不支持为 Surfboard 生成 v2ray-plugin 的 Shadowsocks 节点，节点 ${
                nodeConfig!.nodeName
              } 会被省略`,
            );
            return void 0;
          }

          return [
            config.nodeName,
            [
              'ss',
              config.hostname,
              config.port,
              'encrypt-method=' + config.method,
              ...pickAndFormatStringList(
                config,
                ['password', 'udpRelay', 'obfs', 'obfsHost'],
                {
                  keyFormat: 'kebabCase',
                },
              ),
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
              ...pickAndFormatStringList(config, ['sni']),
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
            ].join(', '),
          ].join(' = ');
        }

        case NodeTypeEnum.Vmess: {
          const config = nodeConfig as VmessNodeConfig;

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
                  getSurfboardExtendHeaders({
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
              ...(typeof config.skipCertVerify === 'boolean'
                ? [`skip-cert-verify=${config.skipCertVerify}`]
                : []),
              ...(config.host ? [`sni=${config.host}`] : []),
            );
          }

          if (nodeConfig?.surfboardConfig?.vmessAEAD) {
            configList.push('vmess-aead=true');
          } else {
            configList.push('vmess-aead=false');
          }

          return [config.nodeName, configList.join(', ')].join(' = ');
        }

        case NodeTypeEnum.Trojan: {
          const configList: string[] = [
            'trojan',
            nodeConfig.hostname,
            `${nodeConfig.port}`,
            `password=${nodeConfig.password}`,
            ...pickAndFormatStringList(nodeConfig, ['sni']),
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
                  JSON.stringify(
                    getSurfboardExtendHeaders(nodeConfig.wsHeaders),
                  ),
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
            ...pickAndFormatStringList(nodeConfig, [
              'username',
              'password',
              'sni',
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
            `不支持为 Surfboard 生成 ${(nodeConfig as any).type} 的节点，节点 ${
              (nodeConfig as any).nodeName
            } 会被省略`,
          );
          return void 0;
      }
    })
    .filter((item): item is string => item !== undefined);

  return result.join('\n');
};
