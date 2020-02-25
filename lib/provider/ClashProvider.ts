import Joi from '@hapi/joi';
import assert from 'assert';
import got from 'got';
import yaml from 'yaml';
import _ from 'lodash';
import { logger } from '@surgio/logger';

import {
  ClashProviderConfig,
  HttpNodeConfig,
  HttpsNodeConfig,
  NodeTypeEnum,
  ShadowsocksNodeConfig,
  ShadowsocksrNodeConfig,
  SnellNodeConfig, SubscriptionUserinfo,
  VmessNodeConfig,
} from '../types';
import { parseSubscriptionUserInfo } from '../utils';
import { ConfigCache, SubsciptionCacheItem, SubscriptionCache } from '../utils/cache';
import { NETWORK_TIMEOUT } from '../utils/constant';
import Provider from './Provider';

type SupportConfigTypes = ShadowsocksNodeConfig|VmessNodeConfig|HttpsNodeConfig|HttpNodeConfig|ShadowsocksrNodeConfig|SnellNodeConfig;

export default class ClashProvider extends Provider {
  public readonly url: string;
  public readonly udpRelay?: boolean;

  constructor(name: string, config: ClashProviderConfig) {
    super(name, config);

    const schema = Joi.object({
      url: Joi
        .string()
        .uri({
          scheme: [
            /https?/,
          ],
        })
        .required(),
    })
      .unknown();

    const { error } = schema.validate(config);

    if (error) {
      throw error;
    }

    this.url = config.url;
    this.udpRelay = config.udpRelay;
  }

  public async getSubscriptionUserInfo(): Promise<SubscriptionUserinfo> {
    const { subscriptionUserinfo } = await getClashSubscription(this.url, this.udpRelay);

    if (subscriptionUserinfo) {
      return subscriptionUserinfo;
    }
    return null;
  }

  public async getNodeList(): Promise<ReadonlyArray<SupportConfigTypes>> {
    const { nodeList } = await getClashSubscription(this.url, this.udpRelay);

    return nodeList;
  }
}

export const getClashSubscription = async (
  url: string,
  udpRelay?: boolean,
): Promise<{
  readonly nodeList: ReadonlyArray<SupportConfigTypes>;
  readonly subscriptionUserinfo?: SubscriptionUserinfo;
}> => {
  assert(url, '未指定订阅地址 url');

  const response: SubsciptionCacheItem = SubscriptionCache.has(url)
    ? SubscriptionCache.get(url)
    : await (
      async () => {
        const res = await got.get(url, {
          timeout: NETWORK_TIMEOUT,
          responseType: 'text',
        });
        const subsciptionCacheItem: SubsciptionCacheItem = {
          body: res.body,
        };

        if (res.headers['subscription-userinfo']) {
          subsciptionCacheItem.subscriptionUserinfo = parseSubscriptionUserInfo(res.headers['subscription-userinfo'] as string);
        }

        SubscriptionCache.set(url, subsciptionCacheItem);

        return subsciptionCacheItem;
      }
    )();
  let clashConfig;

  try {
    clashConfig = yaml.parse(response.body);

    if (typeof clashConfig === 'string') {
      throw new Error();
    }
  } catch (err) {
    throw new Error(`${url} 不是一个合法的 YAML 文件`);
  }

  const proxyList: any[] = clashConfig.Proxy;

  const nodeList = proxyList.map<SupportConfigTypes>(item => {
    switch (item.type) {
      case 'ss':
        // istanbul ignore next
        if (item.plugin && !['obfs', 'v2ray-plugin'].includes(item.plugin)) {
          logger.warn(`不支持从 Clash 订阅中读取 ${item.plugin} 类型的 Shadowsocks 节点，节点 ${item.name} 会被省略`);
          return null;
        }
        // istanbul ignore next
        if (item.plugin === 'v2ray-plugin' && item['plugin-opts'].mode.toLowerCase() === 'quic') {
          logger.warn(`不支持从 Clash 订阅中读取 QUIC 模式的 Shadowsocks 节点，节点 ${item.name} 会被省略`);
          return null;
        }

        return {
          type: NodeTypeEnum.Shadowsocks,
          nodeName: item.name,
          hostname: item.server,
          port: item.port,
          method: item.cipher,
          password: item.password,
          'udp-relay': resolveUdpRelay(item.udp, udpRelay),
          ...(item.plugin && item.plugin === 'obfs' ? {
            obfs: item['plugin-opts'].mode,
            'obfs-host': item['plugin-opts'].host || 'www.bing.com',
          } : null),
          ...(item.obfs ? {
            obfs: item.obfs,
            'obfs-host': item['obfs-host'] || 'www.bing.com',
          } : null),
          ...(item.plugin && item.plugin === 'v2ray-plugin' && item['plugin-opts'].mode === 'websocket' ? {
            obfs: item['plugin-opts'].tls === true ? 'wss' : 'ws',
            'obfs-host': item['plugin-opts'].host || item.server,
            'obfs-uri': item['plugin-opts'].path || '/',
            ...(item['plugin-opts'].tls === true ? {
              skipCertVerify: item['plugin-opts']['skip-cert-verify'] === true,
            } : null),
          } : null),
        };

      case 'vmess':
        // istanbul ignore next
        if (['kcp', 'http'].indexOf(item.network) > -1) {
          logger.warn(`不支持从 Clash 订阅中读取 network 类型为 ${item.network} 的 Vmess 节点，节点 ${item.name} 会被省略`);
          return null;
        }

        return {
          type: NodeTypeEnum.Vmess,
          nodeName: item.name,
          hostname: item.server,
          port: item.port,
          uuid: item.uuid,
          alterId: item.alterId ? `${item.alterId}` : '0',
          method: item.cipher || 'auto',
          udp: resolveUdpRelay(item.udp, udpRelay),
          tls: item.tls ?? false,
          network: item.network || 'tcp',
          ...(item.network === 'ws' ? {
            path: _.get(item, 'ws-path', '/'),
            host: _.get(item, 'ws-headers.Host', ''),
          } : null),
          ...(item.tls ? {
            skipCertVerify: item['skip-cert-verify'] === true,
          } : null),
        };

      case 'http':
        if (!item.tls) {
          return {
            type: NodeTypeEnum.HTTP,
            nodeName: item.name,
            hostname: item.server,
            port: item.port,
            username: item.username /* istanbul ignore next */ || '',
            password: item.password /* istanbul ignore next */ || '',
          };
        }

        return {
          type: NodeTypeEnum.HTTPS,
          nodeName: item.name,
          hostname: item.server,
          port: item.port,
          username: item.username || '',
          password: item.password || '',
          skipCertVerify: item['skip-cert-verify'] === true,
        };

      case 'snell':
        return {
          type: NodeTypeEnum.Snell,
          nodeName: item.name,
          hostname: item.server,
          port: item.port,
          psk: item.psk,
          obfs: _.get(item, 'obfs-opts.mode', 'http'),
        };

      // istanbul ignore next
      case 'ssr':
        return {
          type: NodeTypeEnum.Shadowsocksr,
          nodeName: item.name,
          hostname: item.server,
          port: item.port,
          password: item.password,
          obfs: item.obfs,
          obfsparam: item.obfsparam,
          protocol: item.protocol,
          protoparam: item.protocolparam,
          method: item.cipher,
        };

      default:
        logger.warn(`不支持从 Clash 订阅中读取 ${item.type} 的节点，节点 ${item.name} 会被省略`);
        return null;
    }
  })
    .filter(item => !!item);

  return {
    nodeList,
    subscriptionUserinfo: response.subscriptionUserinfo,
  };
};

function resolveUdpRelay(val?: boolean, defaultVal = false): boolean {
  if (val !== void 0) {
    return val;
  }
  return defaultVal;
}
