import Joi from '@hapi/joi';
import assert from 'assert';
import got from 'got';

import { ShadowsocksrNodeConfig, ShadowsocksrSubscribeProviderConfig, SubscriptionUserinfo } from '../types';
import { fromBase64 } from '../utils';
import { parseSubscriptionUserInfo } from '../utils/subscription';
import { SubsciptionCacheItem, SubscriptionCache } from '../utils/cache';
import { NETWORK_TIMEOUT } from '../utils/constant';
import { parseSSRUri } from '../utils/ssr';
import Provider from './Provider';

export default class ShadowsocksrSubscribeProvider extends Provider {
  public readonly url: string;
  public readonly udpRelay?: boolean;

  constructor(name: string, config: ShadowsocksrSubscribeProviderConfig) {
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
  }

  public async getSubscriptionUserInfo(): Promise<SubscriptionUserinfo> {
    const { subscriptionUserinfo } = await getShadowsocksrSubscription(this.url, this.udpRelay);

    if (subscriptionUserinfo) {
      return subscriptionUserinfo;
    }
    return null;
  }

  public async getNodeList(): Promise<ReadonlyArray<ShadowsocksrNodeConfig>> {
    const { nodeList } = await getShadowsocksrSubscription(this.url, this.udpRelay);

    return nodeList;
  }
}

export const getShadowsocksrSubscription = async (
  url: string,
  udpRelay?: boolean,
): Promise<{
  readonly nodeList: ReadonlyArray<ShadowsocksrNodeConfig>;
  readonly subscriptionUserinfo?: SubscriptionUserinfo;
}> => {
  assert(url, '未指定订阅地址 url');

  async function requestConfigFromRemote(): ReturnType<typeof getShadowsocksrSubscription> {
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

    const nodeList = fromBase64(response.body)
      .split('\n')
      .filter(item => !!item && item.startsWith('ssr://'))
      .map<ShadowsocksrNodeConfig>(str => {
        const nodeConfig = parseSSRUri(str);

        if (udpRelay !== void 0) {
          (nodeConfig['udp-relay'] as boolean) = udpRelay;
        }

        return nodeConfig;
      });

    return {
      nodeList,
      subscriptionUserinfo: response.subscriptionUserinfo,
    };
  }

  return await requestConfigFromRemote();
};

