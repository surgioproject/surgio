import { createLogger } from '@surgio/logger';
import _ from 'lodash';

import { ERR_INVALID_FILTER, OBFS_UA } from '../constant';
import {
  NodeFilterType,
  NodeNameFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  SimpleNodeConfig,
  SortedNodeNameFilterType,
} from '../types';
import { isIp, pickAndFormatStringList } from './';
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
  wireguardFilter,
} from './filter';

const logger = createLogger({ service: 'surgio:utils:surge' });

export const getSurgeExtendHeaders = (
  wsHeaders: Record<string, string>,
): string => {
  return Object.keys(wsHeaders)
    .map((headerKey) => `${headerKey.toLowerCase()}:${wsHeaders[headerKey]}`)
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
          if (nodeConfig.obfs && ['ws', 'wss'].includes(nodeConfig.obfs)) {
            logger.warn(
              `不支持为 Surge 生成 v2ray-plugin 的 Shadowsocks 节点，节点 ${nodeConfig.nodeName} 会被省略`,
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
                [
                  'password',
                  'udpRelay',
                  'obfs',
                  'obfsHost',
                  'tfo',
                  'mptcp',
                  'testUrl',
                  'underlyingProxy',
                ],
                {
                  keyFormat: 'kebabCase',
                },
              ),
              ...parseShadowTlsConfig(nodeConfig),
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
              ...pickAndFormatStringList(
                nodeConfig,
                [
                  'sni',
                  'tfo',
                  'mptcp',
                  'tls13',
                  'testUrl',
                  'skipCertVerify',
                  'underlyingProxy',
                  'serverCertFingerprintSha256',
                ],
                {
                  keyFormat: 'kebabCase',
                },
              ),
              ...parseShadowTlsConfig(nodeConfig),
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
              ...pickAndFormatStringList(
                nodeConfig,
                ['tfo', 'mptcp', 'underlyingProxy', 'testUrl'],
                {
                  keyFormat: 'kebabCase',
                },
              ),
              ...parseShadowTlsConfig(nodeConfig),
            ].join(', '),
          ].join(' = ');
        }

        case NodeTypeEnum.Snell: {
          return [
            nodeConfig.nodeName,
            [
              'snell',
              nodeConfig.hostname,
              nodeConfig.port,
              ...pickAndFormatStringList(
                nodeConfig,
                [
                  'psk',
                  'obfs',
                  'obfsHost',
                  'version',
                  'reuse',
                  'tfo',
                  'mptcp',
                  'testUrl',
                  'underlyingProxy',
                ],
                {
                  keyFormat: 'kebabCase',
                },
              ),
              ...parseShadowTlsConfig(nodeConfig),
            ].join(', '),
          ].join(' = ');
        }

        case NodeTypeEnum.Shadowsocksr: {
          // istanbul ignore next
          if (!nodeConfig.binPath) {
            throw new Error(
              '请按照文档 https://url.royli.dev/vdGh2 添加 Shadowsocksr 二进制文件路径',
            );
          }

          const args = [
            '-s',
            nodeConfig.hostname,
            '-p',
            `${nodeConfig.port}`,
            '-m',
            nodeConfig.method,
            '-o',
            nodeConfig.obfs,
            '-O',
            nodeConfig.protocol,
            '-k',
            nodeConfig.password,
            '-l',
            `${nodeConfig.localPort}`,
            '-b',
            '127.0.0.1',
          ];

          if (nodeConfig.protoparam) {
            args.push('-G', nodeConfig.protoparam);
          }
          if (nodeConfig.obfsparam) {
            args.push('-g', nodeConfig.obfsparam);
          }

          const nodeConfigString = [
            'external',
            `exec = ${JSON.stringify(nodeConfig.binPath)}`,
            ...args.map((arg) => `args = ${JSON.stringify(arg)}`),
            `local-port = ${nodeConfig.localPort}`,
          ];

          if (nodeConfig.localPort === 0) {
            throw new Error(
              `为 Surge 生成 SSR 配置时必须为 Provider ${nodeConfig.provider?.name} 设置 startPort，参考 https://url.royli.dev/bWcpe`,
            );
          }

          if (nodeConfig.hostnameIp && nodeConfig.hostnameIp.length) {
            nodeConfigString.push(
              ...nodeConfig.hostnameIp.map((item) => `addresses = ${item}`),
            );
          }

          if (isIp(nodeConfig.hostname)) {
            nodeConfigString.push(`addresses = ${nodeConfig.hostname}`);
          }

          return [nodeConfig.nodeName, nodeConfigString.join(', ')].join(' = ');
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
                  getSurgeExtendHeaders({
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
              ...pickAndFormatStringList(
                nodeConfig,
                ['tls13', 'skipCertVerify', 'serverCertFingerprintSha256'],
                {
                  keyFormat: 'kebabCase',
                },
              ),
              ...(nodeConfig.host ? [`sni=${nodeConfig.host}`] : []),
            );
          }

          result.push(
            ...pickAndFormatStringList(
              nodeConfig,
              ['tfo', 'mptcp', 'underlyingProxy', 'testUrl'],
              {
                keyFormat: 'kebabCase',
              },
            ),
          );

          if (nodeConfig?.surgeConfig?.vmessAEAD) {
            result.push('vmess-aead=true');
          } else {
            result.push('vmess-aead=false');
          }

          result.push(...parseShadowTlsConfig(nodeConfig));

          return [nodeConfig.nodeName, result.join(', ')].join(' = ');
        }

        case NodeTypeEnum.Trojan: {
          const result: string[] = [
            'trojan',
            nodeConfig.hostname,
            `${nodeConfig.port}`,
            `password=${nodeConfig.password}`,
            ...pickAndFormatStringList(
              nodeConfig,
              [
                'tfo',
                'mptcp',
                'sni',
                'tls13',
                'testUrl',
                'underlyingProxy',
                'skipCertVerify',
                'serverCertFingerprintSha256',
              ],
              {
                keyFormat: 'kebabCase',
              },
            ),
            ...parseShadowTlsConfig(nodeConfig),
          ];

          if (nodeConfig.network === 'ws') {
            result.push('ws=true');
            result.push(`ws-path=${nodeConfig.wsPath}`);

            if (nodeConfig.wsHeaders) {
              result.push(
                'ws-headers=' +
                  JSON.stringify(getSurgeExtendHeaders(nodeConfig.wsHeaders)),
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
            ...pickAndFormatStringList(
              nodeConfig,
              [
                'username',
                'password',
                'sni',
                'tfo',
                'mptcp',
                'tls13',
                'udpRelay',
                'testUrl',
                'underlyingProxy',
                'serverCertFingerprintSha256',
              ],
              {
                keyFormat: 'kebabCase',
              },
            ),
            ...parseShadowTlsConfig(nodeConfig),
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

        case NodeTypeEnum.Tuic: {
          const result = [
            'tuic',
            nodeConfig.hostname,
            nodeConfig.port,
            ...pickAndFormatStringList(
              nodeConfig,
              [
                'token',
                'sni',
                'underlyingProxy',
                'testUrl',
                'skipCertVerify',
                'serverCertFingerprintSha256',
              ],
              {
                keyFormat: 'kebabCase',
              },
            ),
            ...(Array.isArray(nodeConfig.alpn)
              ? [`alpn=${nodeConfig.alpn.join(',')}`]
              : []),
          ];

          return [nodeConfig.nodeName, result.join(', ')].join(' = ');
        }

        case NodeTypeEnum.Wireguard:
          logger.info(
            '请配合使用 getSurgeWireguardNodes 生成 Wireguard 节点配置',
          );

          return [
            nodeConfig.nodeName,
            ' = wireguard, section-name = ',
            nodeConfig.nodeName,
          ].join('');

        // istanbul ignore next
        default:
          logger.warn(
            `不支持为 Surge 生成 ${(nodeConfig as any).type} 的节点，节点 ${
              (nodeConfig as any).nodeName
            } 会被省略`,
          );
          return undefined;
      }
    })
    .filter((item): item is string => item !== undefined);

  return result.join('\n');
};

export const getSurgeWireguardNodes = (
  list: ReadonlyArray<PossibleNodeConfigType>,
): string => {
  const result = list
    .map((nodeConfig) => {
      if (nodeConfig.type !== NodeTypeEnum.Wireguard) {
        return undefined;
      }

      const nodeConfigSection: string[] = [
        `[WireGuard ${nodeConfig.nodeName}]`,
        `self-ip=${nodeConfig.selfIp}`,
        `private-key=${nodeConfig.privateKey}`,
      ];
      const peerConfig: string[] = [
        `endpoint=${nodeConfig.endpoint}`,
        `public-key=${nodeConfig.publicKey}`,
      ];
      const optionalKeys: Array<keyof typeof nodeConfig> = [
        'mtu',
        'dnsServer',
        'preferIpv6',
        'selfIpV6',
      ];
      const optionalPeerConfigKeys: Array<keyof typeof nodeConfig> = [
        'presharedKey',
        'allowedIps',
      ];

      for (const key of optionalKeys) {
        if (nodeConfig[key] !== undefined) {
          nodeConfigSection.push(
            ...pickAndFormatStringList(nodeConfig, [key], {
              keyFormat: 'kebabCase',
            }),
          );
        }
      }

      for (const key of optionalPeerConfigKeys) {
        if (nodeConfig[key] !== undefined) {
          peerConfig.push(
            ...pickAndFormatStringList(nodeConfig, [key], {
              keyFormat: 'kebabCase',
            }),
          );
        }
      }

      if (nodeConfig.keepAlive) {
        peerConfig.push(`keepalive=${nodeConfig.keepAlive}`);
      }

      nodeConfigSection.push(`peer=(${peerConfig.join(', ')})`);

      return nodeConfigSection.join('\n');
    })
    .filter((item): item is string => item !== undefined);

  return result.join('\n\n');
};

export const getSurgeNodeNames = function (
  list: ReadonlyArray<SimpleNodeConfig>,
  filter?: NodeNameFilterType | SortedNodeNameFilterType,
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
        snellFilter(item) ||
        tuicFilter(item) ||
        httpFilter(item) ||
        httpsFilter(item) ||
        trojanFilter(item) ||
        socks5Filter(item) ||
        wireguardFilter(item),
    ),
    filter,
  )
    .map((item) => item.nodeName)
    .join(separator || ', ');
};

function parseShadowTlsConfig(nodeConfig: PossibleNodeConfigType) {
  const result: string[] = [];

  if (nodeConfig.shadowTls) {
    result.push(
      `shadow-tls-password=${nodeConfig.shadowTls.password}`,
      `shadow-tls-sni=${nodeConfig.shadowTls.sni}`,
    );

    if (nodeConfig.shadowTls.version) {
      result.push(`shadow-tls-version=${nodeConfig.shadowTls.version}`);
    }
  }

  return result;
}
