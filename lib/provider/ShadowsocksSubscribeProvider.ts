import Joi from '@hapi/joi';
import assert from 'assert';
import got from 'got';
import { default as legacyUrl } from 'url';
import Debug from 'debug';
import { createLogger } from '@surgio/logger';

import {
  NodeTypeEnum,
  ShadowsocksNodeConfig,
  ShadowsocksSubscribeProviderConfig,
  SubscriptionUserinfo,
} from '../types';
import { decodeStringList, fromBase64, fromUrlSafeBase64 } from '../utils';
import { parseSubscriptionUserInfo } from '../utils/subscription';
import { SubsciptionCacheItem, SubscriptionCache } from '../utils/cache';
import { NETWORK_TIMEOUT } from '../utils/constant';
import Provider from './Provider';

const logger = createLogger({
  service: 'surgio:ShadowsocksSubscribeProvider',
});
const debug = Debug('surgio:ShadowsocksSubscribeProvider');

export default class ShadowsocksSubscribeProvider extends Provider {
  public readonly url: string;
  public readonly udpRelay?: boolean;

  constructor(name: string, config: ShadowsocksSubscribeProviderConfig) {
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
      udpRelay: Joi.boolean(),
    })
      .unknown();

    const { error } = schema.validate(config);

    // istanbul ignore next
    if (error) {
      throw error;
    }

    this.url = config.url;
    this.udpRelay = config.udpRelay;
    this.supportGetSubscriptionUserInfo = true;
  }

  public async getSubscriptionUserInfo(): Promise<SubscriptionUserinfo> {
    const { subscriptionUserinfo } = await getShadowsocksSubscription(this.url, this.udpRelay);

    if (subscriptionUserinfo) {
      return subscriptionUserinfo;
    }
    return null;
  }

  public async getNodeList(): Promise<ReadonlyArray<ShadowsocksNodeConfig>> {
    const { nodeList } = await getShadowsocksSubscription(this.url, this.udpRelay);

    return nodeList;
  }
}

/**
 * @see https://shadowsocks.org/en/spec/SIP002-URI-Scheme.html
 */
export const getShadowsocksSubscription = async (
  url: string,
  udpRelay?: boolean,
): Promise<{
  readonly nodeList: ReadonlyArray<ShadowsocksNodeConfig>;
  readonly subscriptionUserinfo?: SubscriptionUserinfo;
}> => {
  assert(url, '未指定订阅地址 url');

  async function requestConfigFromRemote(): ReturnType<typeof getShadowsocksSubscription> {
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

    const nodeList = fromBase64(response.body)
      .split('\n')
      .filter(item => !!item && item.startsWith('ss://'))
      .map<any>(item => {
        debug('Parsing Shadowsocks URI', item);
        const scheme = legacyUrl.parse(item, true);
        const userInfo = fromUrlSafeBase64(scheme.auth).split(':');
        const pluginInfo = typeof scheme.query.plugin === 'string' ? decodeStringList(scheme.query.plugin.split(';')) : {};

        return {
          type: NodeTypeEnum.Shadowsocks,
          nodeName: decodeURIComponent(scheme.hash.replace('#', '')),
          hostname: scheme.hostname,
          port: scheme.port,
          method: userInfo[0],
          password: userInfo[1],
          ...(typeof udpRelay === 'boolean' ? {
            'udp-relay': udpRelay,
          } : null),
          ...(pluginInfo['obfs-local'] ? {
            obfs: pluginInfo.obfs,
            'obfs-host': pluginInfo['obfs-host'],
          } : null),
          ...(pluginInfo['v2ray-plugin'] ? {
            obfs: pluginInfo.tls ? 'wss' : 'ws',
            'obfs-host': pluginInfo.host,
          } : null),
        };
      });

    return {
      nodeList,
      subscriptionUserinfo: response.subscriptionUserinfo,
    };
  }

  return await requestConfigFromRemote();
};
