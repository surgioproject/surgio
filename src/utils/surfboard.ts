import { createLogger } from '@surgio/logger';
import _ from 'lodash';

import { ERR_INVALID_FILTER, OBFS_UA } from '../constant';
import {
  NodeFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  SortedNodeFilterType,
} from '../types';
import { pickAndFormatStringList } from './index';
import {
  applyFilter,
  httpFilter,
  httpsFilter,
  shadowsocksFilter,
  shadowsocksrFilter,
  socks5Filter,
  trojanFilter,
  vmessFilter,
} from './filter';

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
  filter?: NodeFilterType | SortedNodeFilterType,
): string {
  // istanbul ignore next
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  const result: string[] = applyFilter(list, filter)
    .map((nodeConfig): string | undefined => {
      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          if (nodeConfig.obfs && ['ws', 'wss'].includes(nodeConfig.obfs)) {
            logger.warn(
              `不支持为 Surfboard 生成 v2ray-plugin 的 Shadowsocks 节点，节点 ${nodeConfig.nodeName} 会被省略`,
            );
            return void 0;
          }

          return [
            nodeConfig.nodeName,
            [
              'ss',
              nodeConfig.hostname,
              nodeConfig.port,
              'encrypt-method=' + nodeConfig.method,
              ...pickAndFormatStringList(
                nodeConfig,
                ['password', 'udpRelay', 'obfs', 'obfsHost'],
                {
                  keyFormat: 'kebabCase',
                },
              ),
            ].join(', '),
          ].join(' = ');
        }

        case NodeTypeEnum.HTTPS: {
          return [
            nodeConfig.nodeName,
            [
              'https',
              nodeConfig.hostname,
              nodeConfig.port,
              nodeConfig.username,
              nodeConfig.password,
              ...(typeof nodeConfig.skipCertVerify === 'boolean'
                ? [`skip-cert-verify=${nodeConfig.skipCertVerify}`]
                : []),
              ...pickAndFormatStringList(nodeConfig, ['sni']),
            ].join(', '),
          ].join(' = ');
        }

        case NodeTypeEnum.HTTP: {
          return [
            nodeConfig.nodeName,
            [
              'http',
              nodeConfig.hostname,
              nodeConfig.port,
              nodeConfig.username,
              nodeConfig.password,
            ].join(', '),
          ].join(' = ');
        }

        case NodeTypeEnum.Vmess: {
          const result = [
            'vmess',
            nodeConfig.hostname,
            nodeConfig.port,
            `username=${nodeConfig.uuid}`,
          ];

          if (
            ['chacha20-ietf-poly1305', 'aes-128-gcm'].includes(
              nodeConfig.method,
            )
          ) {
            result.push(`encrypt-method=${nodeConfig.method}`);
          }

          if (nodeConfig.network === 'ws') {
            result.push('ws=true');
            result.push(`ws-path=${nodeConfig.path}`);
            result.push(
              'ws-headers=' +
                JSON.stringify(
                  getSurfboardExtendHeaders({
                    host: nodeConfig.host || nodeConfig.hostname,
                    'user-agent': OBFS_UA,
                    ..._.omit(nodeConfig.wsHeaders, ['host']), // host 本质上是一个头信息，所以可能存在冲突的情况。以 host 属性为准。
                  }),
                ),
            );
          }

          if (nodeConfig.tls) {
            result.push(
              'tls=true',
              ...(typeof nodeConfig.skipCertVerify === 'boolean'
                ? [`skip-cert-verify=${nodeConfig.skipCertVerify}`]
                : []),
              ...(nodeConfig.host ? [`sni=${nodeConfig.host}`] : []),
            );
          }

          if (nodeConfig?.surfboardConfig?.vmessAEAD) {
            result.push('vmess-aead=true');
          } else {
            result.push('vmess-aead=false');
          }

          return [nodeConfig.nodeName, result.join(', ')].join(' = ');
        }

        case NodeTypeEnum.Trojan: {
          const result: string[] = [
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
            result.push('ws=true');
            result.push(`ws-path=${nodeConfig.wsPath}`);

            if (nodeConfig.wsHeaders) {
              result.push(
                'ws-headers=' +
                  JSON.stringify(
                    getSurfboardExtendHeaders(nodeConfig.wsHeaders),
                  ),
              );
            }
          }

          return [nodeConfig.nodeName, result.join(', ')].join(' = ');
        }

        case NodeTypeEnum.Socks5: {
          const result = [
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
            result.push(
              ...(typeof nodeConfig.skipCertVerify === 'boolean'
                ? [`skip-cert-verify=${nodeConfig.skipCertVerify}`]
                : []),
              ...(typeof nodeConfig.clientCert === 'string'
                ? [`client-cert=${nodeConfig.clientCert}`]
                : []),
            );
          }

          return [nodeConfig.nodeName, result.join(', ')].join(' = ');
        }

        // istanbul ignore next
        default:
          logger.warn(
            `不支持为 Surfboard 生成 ${nodeConfig.type} 的节点，节点 ${nodeConfig.nodeName} 会被省略`,
          );
          return void 0;
      }
    })
    .filter((item): item is string => item !== undefined);

  return result.join('\n');
};

export const getSurfboardNodeNames = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  separator?: string,
): string {
  // istanbul ignore next
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  return applyFilter(
    list.filter(
      (item) =>
        shadowsocksFilter(item) ||
        shadowsocksrFilter(item) ||
        vmessFilter(item) ||
        httpFilter(item) ||
        httpsFilter(item) ||
        trojanFilter(item) ||
        socks5Filter(item),
    ),
    filter,
  )
    .map((item) => item.nodeName)
    .join(separator || ', ');
};
