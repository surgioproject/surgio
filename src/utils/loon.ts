import { createLogger } from '@surgio/logger';
import _ from 'lodash';

import {
  NodeNameFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  SortedNodeNameFilterType,
} from '../types';
import { ERR_INVALID_FILTER } from '../constant';
import { applyFilter } from './filter';

const logger = createLogger({ service: 'surgio:utils:loon' });

// @see https://www.notion.so/1-9809ce5acf524d868affee8dd5fc0a6e
export const getLoonNodes = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeNameFilterType | SortedNodeNameFilterType,
): string {
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER);
  }

  const result: ReadonlyArray<string> = applyFilter(list, filter)
    .map((nodeConfig): string | undefined => {
      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          const config: Array<string | number> = [
            `${nodeConfig.nodeName} = Shadowsocks`,
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.method,
            JSON.stringify(nodeConfig.password),
          ];

          if (nodeConfig.obfs) {
            if (['http', 'tls'].includes(nodeConfig.obfs)) {
              config.push(
                nodeConfig.obfs,
                nodeConfig['obfs-host'] || nodeConfig.hostname,
              );
            } else {
              logger.warn(
                `不支持为 Loon 生成混淆为 ${nodeConfig.obfs} 的节点，节点 ${nodeConfig.nodeName} 会被省略`,
              );
              return void 0;
            }
          }

          if (nodeConfig.tfo) {
            config.push('fast-open=true');
          }

          if (nodeConfig['udp-relay']) {
            config.push('udp=true');
          }

          return config.join(',');
        }

        case NodeTypeEnum.Shadowsocksr: {
          const config: Array<string | number> = [
            `${nodeConfig.nodeName} = ShadowsocksR`,
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.method,
            JSON.stringify(nodeConfig.password),
            `protocol=${nodeConfig.protocol}`,
            `protocol-param=${nodeConfig.protoparam}`,
            `obfs=${nodeConfig.obfs}`,
            `obfs-param=${nodeConfig.obfsparam}`,
          ];

          if (nodeConfig.tfo) {
            config.push('fast-open=true');
          }

          if (nodeConfig['udp-relay']) {
            config.push('udp=true');
          }

          return config.join(',');
        }

        case NodeTypeEnum.Vmess: {
          const config: Array<string | number> = [
            `${nodeConfig.nodeName} = vmess`,
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.method === 'auto'
              ? `method=chacha20-ietf-poly1305`
              : `method=${nodeConfig.method}`,
            JSON.stringify(nodeConfig.uuid),
            `transport=${nodeConfig.network}`,
          ];

          if (nodeConfig.network === 'ws') {
            config.push(
              `path=${nodeConfig.path || '/'}`,
              `host=${nodeConfig.host || nodeConfig.hostname}`,
            );

            if (Object.keys(_.omit(nodeConfig.wsHeaders, 'host')).length > 0) {
              logger.warn(
                `Loon 不支持自定义额外的 Header 字段，节点 ${nodeConfig.nodeName} 可能不可用`,
              );
            }
          }

          if (nodeConfig.tls) {
            config.push(
              `over-tls=${nodeConfig.tls}`,
              `tls-name=${nodeConfig.host || nodeConfig.hostname}`,
              `skip-cert-verify=${nodeConfig.skipCertVerify === true}`,
            );
          }

          return config.join(',');
        }

        case NodeTypeEnum.Trojan: {
          const config: Array<string | number> = [
            `${nodeConfig.nodeName} = trojan`,
            nodeConfig.hostname,
            nodeConfig.port,
            JSON.stringify(nodeConfig.password),
            `tls-name=${nodeConfig.sni || nodeConfig.hostname}`,
            `skip-cert-verify=${nodeConfig.skipCertVerify === true}`,
          ];

          if (nodeConfig.network === 'ws') {
            config.push('transport=ws', `path=${nodeConfig.wsPath || '/'}`);

            if (nodeConfig.wsHeaders) {
              if (_.get(nodeConfig, 'wsHeaders.host')) {
                config.push(`host=${nodeConfig.wsHeaders.host}`);
              }

              if (
                Object.keys(_.omit(nodeConfig.wsHeaders, 'host')).length > 0
              ) {
                logger.warn(
                  `Loon 不支持自定义额外的 Header 字段，节点 ${nodeConfig.nodeName} 可能不可用`,
                );
              }
            }
          }

          return config.join(',');
        }

        case NodeTypeEnum.HTTPS: {
          const config: Array<string | number> = [
            `${nodeConfig.nodeName} = https`,
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.username /* istanbul ignore next */ || '',
            JSON.stringify(
              nodeConfig.password /* istanbul ignore next */ || '',
            ),
            `tls-name=${nodeConfig.sni || nodeConfig.hostname}`,
            `skip-cert-verify=${nodeConfig.skipCertVerify === true}`,
          ];

          return config.join(',');
        }

        case NodeTypeEnum.HTTP:
          return [
            `${nodeConfig.nodeName} = http`,
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.username /* istanbul ignore next */ || '',
            JSON.stringify(
              nodeConfig.password /* istanbul ignore next */ || '',
            ),
          ].join(',');

        // istanbul ignore next
        default:
          logger.warn(
            `不支持为 Loon 生成 ${nodeConfig.type} 的节点，节点 ${nodeConfig.nodeName} 会被省略`,
          );
          return void 0;
      }
    })
    .filter((item): item is string => item !== undefined);

  return result.join('\n');
};
