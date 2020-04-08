import Joi from '@hapi/joi';
import assert from 'assert';
import got from 'got';
import yaml from 'yaml';
import _ from 'lodash';
import { createLogger } from '@surgio/logger';

import {
  ClashProviderConfig,
  HttpNodeConfig,
  HttpsNodeConfig,
  NodeTypeEnum,
  ShadowsocksNodeConfig,
  ShadowsocksrNodeConfig,
  SnellNodeConfig,
  SubscriptionUserinfo,
  TrojanNodeConfig,
  VmessNodeConfig,
} from '../types';
import { lowercaseHeaderKeys } from '../utils';
import { parseSubscriptionUserInfo } from '../utils/subscription';
import { SubsciptionCacheItem, SubscriptionCache } from '../utils/cache';
import { NETWORK_TIMEOUT, RELAY_SERVICE } from '../utils/constant';
import Provider from './Provider';

type SupportConfigTypes = ShadowsocksNodeConfig|VmessNodeConfig|HttpsNodeConfig|HttpNodeConfig|ShadowsocksrNodeConfig|SnellNodeConfig|TrojanNodeConfig;

const logger = createLogger({
  service: 'surgio:ClashProvider',
});

export default class ClashProvider extends Provider {
  public readonly _url: string;
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

    this._url = config.url;
    this.udpRelay = config.udpRelay;
    this.supportGetSubscriptionUserInfo = true;
  }

  public get url(): string {
    if (this.relayUrl) {
      return `${RELAY_SERVICE}${this._url}`;
    }
    return this._url;
  }

  public async getSubscriptionUserInfo(): Promise<SubscriptionUserinfo|undefined> {
    const { subscriptionUserinfo } = await getClashSubscription(this.url, this.udpRelay);

    if (subscriptionUserinfo) {
      return subscriptionUserinfo;
    }
    return void 0;
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

  const response = SubscriptionCache.has(url)
    ? SubscriptionCache.get(url) as SubsciptionCacheItem
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
          logger.debug(
            '%s received subscription userinfo - raw: %s | parsed: %j',
            url,
            res.headers['subscription-userinfo'],
            subsciptionCacheItem.subscriptionUserinfo
          );
        }

        SubscriptionCache.set(url, subsciptionCacheItem);

        return subsciptionCacheItem;
      }
    )();
  let clashConfig;

  try {
    clashConfig = yaml.parse(response.body);
  } catch (err) /* istanbul ignore next */ {
    throw new Error(`${url} 不是一个合法的 YAML 文件`);
  }

  if (
    !_.isPlainObject(clashConfig) ||
    (
      !('Proxy' in clashConfig) &&
      !('proxies' in clashConfig)
    )
  ) {
    throw new Error(`${url} 订阅内容有误，请检查后重试`);
  }

  const proxyList: any[] = clashConfig.Proxy || clashConfig.proxies;

  // istanbul ignore next
  if (!Array.isArray(proxyList)) {
    throw new Error(`${url} 订阅内容有误，请检查后重试`);
  }

  return {
    nodeList: parseClashConfig(proxyList, udpRelay),
    subscriptionUserinfo: response.subscriptionUserinfo,
  };
};

export const parseClashConfig = (proxyList: ReadonlyArray<any>, udpRelay?: boolean): ReadonlyArray<SupportConfigTypes> => {
  const nodeList: ReadonlyArray<SupportConfigTypes|undefined> = proxyList
    .map(item => {
      switch (item.type) {
        case 'ss': {
          // istanbul ignore next
          if (item.plugin && !['obfs', 'v2ray-plugin'].includes(item.plugin)) {
            logger.warn(`不支持从 Clash 订阅中读取 ${item.plugin} 类型的 Shadowsocks 节点，节点 ${item.name} 会被省略`);
            return void 0;
          }
          // istanbul ignore next
          if (item.plugin === 'v2ray-plugin' && item['plugin-opts'].mode.toLowerCase() === 'quic') {
            logger.warn(`不支持从 Clash 订阅中读取 QUIC 模式的 Shadowsocks 节点，节点 ${item.name} 会被省略`);
            return void 0;
          }

          const wsHeaders = lowercaseHeaderKeys(_.get(item, 'plugin-opts.headers', {}));

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
              wsHeaders,
              ...(item['plugin-opts'].tls === true ? {
                skipCertVerify: item['plugin-opts']['skip-cert-verify'] === true,
              } : null),
            } : null),
          } as ShadowsocksNodeConfig;
        }

        case 'vmess': {
          // istanbul ignore next
          if (['kcp', 'http'].indexOf(item.network) > -1) {
            logger.warn(`不支持从 Clash 订阅中读取 network 类型为 ${item.network} 的 Vmess 节点，节点 ${item.name} 会被省略`);
            return void 0;
          }

          const wsHeaders = lowercaseHeaderKeys(_.get(item, 'ws-headers', {}));

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
              host: _.get(wsHeaders, 'host', item.server),
              wsHeaders,
            } : null),
            ...(item.tls ? {
              skipCertVerify: item['skip-cert-verify'] === true,
            } : null),
          } as VmessNodeConfig;
        }

        case 'http':
          if (!item.tls) {
            return {
              type: NodeTypeEnum.HTTP,
              nodeName: item.name,
              hostname: item.server,
              port: item.port,
              username: item.username /* istanbul ignore next */ || '',
              password: item.password /* istanbul ignore next */ || '',
            } as HttpNodeConfig;
          }

          return {
            type: NodeTypeEnum.HTTPS,
            nodeName: item.name,
            hostname: item.server,
            port: item.port,
            username: item.username || '',
            password: item.password || '',
            skipCertVerify: item['skip-cert-verify'] === true,
          } as HttpsNodeConfig;

        case 'snell':
          return {
            type: NodeTypeEnum.Snell,
            nodeName: item.name,
            hostname: item.server,
            port: item.port,
            psk: item.psk,
            obfs: _.get(item, 'obfs-opts.mode', 'http'),
            ...(typeof item?.['obfs-opts']?.host !== 'undefined' ? { 'obfs-host': item['obfs-opts'].host } : null),
            ...('version' in item ? { version: item.version } : null),
          } as SnellNodeConfig;

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
          } as ShadowsocksrNodeConfig;

        case 'trojan':
          return {
            type: NodeTypeEnum.Trojan,
            nodeName: item.name,
            hostname: item.server,
            port: item.port,
            password: item.password,
            ...('skip-cert-verify' in item ? { skipCertVerify: item['skip-cert-verify'] === true } : null),
            ...('alpn' in item ? { alpn: item.alpn } : null),
            ...('sni' in item ? { sni: item.sni } : null),
            ...('udp' in item ? { 'udp-relay': item.udp } : null),
          } as TrojanNodeConfig;

        default:
          logger.warn(`不支持从 Clash 订阅中读取 ${item.type} 的节点，节点 ${item.name} 会被省略`);
          return void 0;
      }
    });

  return nodeList.filter((item): item is SupportConfigTypes => item !== undefined);
};

function resolveUdpRelay(val?: boolean, defaultVal = false): boolean {
  if (val !== void 0) {
    return val;
  }
  return defaultVal;
}
