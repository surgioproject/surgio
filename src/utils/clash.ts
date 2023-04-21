import { createLogger } from '@surgio/logger';
import _ from 'lodash';

import { ERR_INVALID_FILTER } from '../constant';
import {
  NodeFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  SortedNodeFilterType,
} from '../types';
import {
  applyFilter,
  httpFilter,
  httpsFilter,
  shadowsocksFilter,
  shadowsocksrFilter,
  snellFilter,
  socks5Filter,
  trojanFilter,
  tuicFilter,
  vmessFilter,
} from './filter';
import { getPortFromHost } from './index';

const logger = createLogger({ service: 'surgio:utils:clash' });

export const getClashNodes = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
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
          if (
            nodeConfig.shadowTls &&
            !nodeConfig.clashConfig?.enableShadowTls
          ) {
            logger.warn(
              `尚未开启 Clash 的 shadow-tls 支持，节点 ${nodeConfig.nodeName} 将被忽略。如需开启，请在配置文件中设置 clashConfig.enableShadowTls 为 true。`,
            );
            return null;
          }

          return {
            type: 'ss',
            cipher: nodeConfig.method,
            name: nodeConfig.nodeName,
            password: nodeConfig.password,
            port: nodeConfig.port,
            server: nodeConfig.hostname,
            udp: nodeConfig.udpRelay === true,
            ...(nodeConfig.obfs && ['tls', 'http'].includes(nodeConfig.obfs)
              ? {
                  plugin: 'obfs',
                  'plugin-opts': {
                    mode: nodeConfig.obfs,
                    host: nodeConfig.obfsHost,
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
                    host: nodeConfig.obfsHost,
                    path: nodeConfig.obfsUri || '/',
                    mux:
                      typeof nodeConfig.mux === 'boolean'
                        ? nodeConfig.mux
                        : false,
                    headers: _.omit(nodeConfig.wsHeaders || {}, ['host']),
                  },
                }
              : null),
            ...(nodeConfig.shadowTls && nodeConfig.clashConfig?.enableShadowTls
              ? {
                  plugin: 'shadow-tls',
                  'client-fingerprint': 'chrome',
                  'plugin-opts': {
                    password: nodeConfig.shadowTls.password,
                    ...(nodeConfig.shadowTls.version
                      ? { version: nodeConfig.shadowTls.version }
                      : null),
                    ...(nodeConfig.shadowTls.sni
                      ? { host: nodeConfig.shadowTls.sni }
                      : null),
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
            udp: nodeConfig.udpRelay === true,
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
          return {
            type: 'ssr',
            name: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            port: nodeConfig.port,
            password: nodeConfig.password,
            obfs: nodeConfig.obfs,
            protocol: nodeConfig.protocol,
            cipher: nodeConfig.method,
            'obfs-param': nodeConfig.obfsparam ?? '',
            'protocol-param': nodeConfig.protoparam ?? '',
            udp: nodeConfig.udpRelay === true,
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
              ...(nodeConfig.obfsHost
                ? {
                    host: nodeConfig.obfsHost,
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
            ...(nodeConfig.udpRelay ? { udp: nodeConfig.udpRelay } : null),
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
              `尚未开启 Clash 的 TUIC 支持，节点 ${nodeConfig.nodeName} 会被省略。如需开启，请在配置文件中设置 clashConfig.enableTuic 为 true。`,
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
            ...(typeof nodeConfig.udpRelay === 'boolean'
              ? { udp: nodeConfig.udpRelay }
              : null),
            ...(nodeConfig.alpn ? { alpn: nodeConfig.alpn } : null),
            ...(nodeConfig.sni ? { sni: nodeConfig.sni } : null),
            'skip-cert-verify': nodeConfig.skipCertVerify === true,
          };

        case NodeTypeEnum.Wireguard:
          // istanbul ignore next
          if (nodeConfig.peers.length > 1) {
            logger.warn(
              `节点 ${nodeConfig.nodeName} 有多个 WireGuard Peer，然而 Stash 或 Clash 仅支持一个 Peer，因此只会使用第一个 Peer。`,
            );
          }

          return {
            type: 'wireguard',
            name: nodeConfig.nodeName,
            'private-key': nodeConfig.privateKey,
            ip: nodeConfig.selfIp,
            ...(nodeConfig.selfIpV6 ? { ipv6: nodeConfig.selfIpV6 } : null),
            ...(nodeConfig.mtu ? { mtu: nodeConfig.mtu } : null),
            ...(nodeConfig.dnsServers ? { dns: nodeConfig.dnsServers } : null),
            udp: true,

            // Peer
            server: nodeConfig.peers[0].endpoint,
            port: getPortFromHost(nodeConfig.peers[0].endpoint),
            'public-key': nodeConfig.peers[0].publicKey,
            ...(nodeConfig.peers[0].presharedKey
              ? { 'preshared-key': nodeConfig.peers[0].presharedKey }
              : null),
            ...(nodeConfig.peers[0].reservedBits
              ? {
                  reserved: nodeConfig.peers[0].reservedBits,
                }
              : null),
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
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
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
    applyFilter(
      list.filter(
        (item) =>
          shadowsocksFilter(item) ||
          shadowsocksrFilter(item) ||
          vmessFilter(item) ||
          httpFilter(item) ||
          httpsFilter(item) ||
          trojanFilter(item) ||
          snellFilter(item) ||
          socks5Filter(item) ||
          (item.clashConfig?.enableTuic && tuicFilter(item)),
      ),
      filter,
    ).map((item) => item.nodeName),
  );

  return result;
};
