import { createLogger } from '@surgio/logger';
import _ from 'lodash';

import { ERR_INVALID_FILTER } from '../constant';
import {
  NodeFilterType,
  NodeNameFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  SimpleNodeConfig,
  SortedNodeNameFilterType,
} from '../types';
import { applyFilter } from './filter';

const logger = createLogger({ service: 'surgio:utils:clash' });

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
                    path: nodeConfig.path,
                    headers: {
                      ...(nodeConfig.host ? { host: nodeConfig.host } : null),
                      ..._.omit(nodeConfig.wsHeaders, ['host']),
                    },
                  },
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
            ...(nodeConfig.network === 'ws'
              ? {
                  network: 'ws',
                  'ws-opts': {
                    path: nodeConfig.wsPath || '/',
                    ...nodeConfig.wsHeaders,
                  },
                }
              : null),
          };

        case NodeTypeEnum.Socks5:
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

        case NodeTypeEnum.Tuic:
          if (!nodeConfig.clashConfig?.enableTuic) {
            logger.warn(
              `默认不为 Clash 生成 Tuic 节点，节点 ${nodeConfig.nodeName} 会被省略。如需开启，请在配置文件中设置 clashConfig.enableTuic 为 true。`,
            );
            return null;
          }
          if (nodeConfig.alpn && !nodeConfig.alpn.length) {
            logger.warn(
              `节点 ${nodeConfig.nodeName} 的 alpn 为空。Stash 客户端不支持 ALPN 为空，默认的 ALPN 为 h3。`,
            );
          }

          return {
            type: 'tuic',
            name: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            port: nodeConfig.port,
            token: nodeConfig.token,
            ...(typeof nodeConfig['udp-relay'] === 'boolean'
              ? { udp: nodeConfig['udp-relay'] }
              : null),
            ...(nodeConfig.alpn ? { alpn: nodeConfig.alpn } : null),
            ...(nodeConfig.sni ? { sni: nodeConfig.sni } : null),
            'skip-cert-verify': nodeConfig.skipCertVerify === true,
          };

        case NodeTypeEnum.WireGuard:
          if (!nodeConfig.clashConfig?.enableWireGuard) {
            logger.warn(
              `默认不为 Clash 生成 WireGuard 节点，节点 ${nodeConfig.nodeName} 会被省略。如需开启，请在配置文件中设置 clashConfig.enableWireGuard 为 true。`,
            );
            return null;
          }
          return {
            type: 'wireguard',
            name: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            port: nodeConfig.port,
            ip: nodeConfig.selfIp,
            ...(nodeConfig.selfIpV6 ? { ipv6: nodeConfig.selfIpV6 } : null),
            'private-key': nodeConfig.privateKey,
            'public-key': nodeConfig.publicKey,
            ...(nodeConfig.presharedKey
              ? { 'preshared-key': nodeConfig.presharedKey }
              : null),
            ...(nodeConfig.dns ? { dns: nodeConfig.dns } : null), // TODO:Attention: don't know if this commit works.
            ...(nodeConfig.mtu ? { mtu: nodeConfig.mtu } : null),
            ...(!(nodeConfig.udp === undefined)
              ? { udp: nodeConfig.udp }
              : { udp: true }),
          };

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
