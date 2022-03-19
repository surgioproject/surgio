import { createLogger } from '@surgio/logger';
import _ from 'lodash';
import { ERR_INVALID_FILTER, OBFS_UA } from '../constant';
import {
  HttpsNodeConfig,
  NodeNameFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  ShadowsocksNodeConfig,
  ShadowsocksrNodeConfig,
  SortedNodeNameFilterType,
  VmessNodeConfig,
} from '../types';
import { applyFilter } from './filter';
import {
  getShadowsocksNodes,
  getShadowsocksrNodes,
  pickAndFormatStringList,
  toBase64,
} from './index';

const logger = createLogger({ service: 'surgio:utils:quantumult' });

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

          switch (nodeConfig.network) {
            case 'ws':
              if (nodeConfig.tls) {
                config.push(`obfs=wss`);

                if (nodeConfig.skipCertVerify) {
                  config.push('tls-verification=false');
                } else {
                  config.push('tls-verification=true');
                }

                // istanbul ignore next
                if (nodeConfig.tls13) {
                  config.push(`tls13=true`);
                }
              } else {
                config.push(`obfs=ws`);
              }
              config.push(`obfs-uri=${nodeConfig.path || '/'}`);
              config.push(
                `obfs-host=${nodeConfig.host || nodeConfig.hostname}`,
              );

              break;
            case 'tcp':
              if (nodeConfig.tls) {
                config.push(`obfs=over-tls`);

                if (nodeConfig.skipCertVerify) {
                  config.push('tls-verification=false');
                } else {
                  config.push('tls-verification=true');
                }

                // istanbul ignore next
                if (nodeConfig.tls13) {
                  config.push(`tls13=true`);
                }
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
          ];

          if (nodeConfig.obfs === 'wss') {
            if (nodeConfig.skipCertVerify) {
              config.push('tls-verification=false');
            } else {
              config.push('tls-verification=true');
            }

            if (nodeConfig.tls13) {
              config.push('tls13=true');
            }
          }

          // istanbul ignore next
          if (
            nodeConfig.wsHeaders &&
            Object.keys(nodeConfig.wsHeaders).length > 1
          ) {
            logger.warn(
              `Quantumult X 不支持自定义额外的 Header 字段，节点 ${nodeConfig.nodeName} 可能不可用`,
            );
          }

          config.push(`tag=${nodeConfig.nodeName}`);

          return `shadowsocks=${config.join(', ')}`;
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
