import Joi from '@hapi/joi';
import assert from 'assert';
import { createLogger } from '@surgio/logger';

import {
  ShadowsocksNodeConfig,
  ShadowsocksSubscribeProviderConfig,
  SubscriptionUserinfo,
} from '../types';
import { fromBase64 } from '../utils';
import httpClient from '../utils/http-client';
import relayableUrl from '../utils/relayable-url';
import { parseSSUri } from '../utils/ss';
import { parseSubscriptionUserInfo } from '../utils/subscription';
import { SubsciptionCacheItem, SubscriptionCache } from '../utils/cache';
import Provider from './Provider';

const logger = createLogger({
  service: 'surgio:ShadowsocksSubscribeProvider',
});

export default class ShadowsocksSubscribeProvider extends Provider {
  public readonly udpRelay?: boolean;
  private readonly _url: string;

  constructor(name: string, config: ShadowsocksSubscribeProviderConfig) {
    super(name, config);

    const schema = Joi.object({
      url: Joi.string()
        .uri({
          scheme: [/https?/],
        })
        .required(),
      udpRelay: Joi.boolean().strict(),
    }).unknown();

    const { error } = schema.validate(config);

    // istanbul ignore next
    if (error) {
      throw error;
    }

    this._url = config.url;
    this.udpRelay = config.udpRelay;
    this.supportGetSubscriptionUserInfo = true;
  }

  // istanbul ignore next
  public get url(): string {
    return relayableUrl(this._url, this.relayUrl);
  }

  public async getSubscriptionUserInfo(): Promise<
    SubscriptionUserinfo | undefined
  > {
    const { subscriptionUserinfo } = await getShadowsocksSubscription(
      this.url,
      this.udpRelay,
    );

    if (subscriptionUserinfo) {
      return subscriptionUserinfo;
    }
    return undefined;
  }

  public async getNodeList(): Promise<ReadonlyArray<ShadowsocksNodeConfig>> {
    const { nodeList } = await getShadowsocksSubscription(
      this.url,
      this.udpRelay,
    );

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

  const response = SubscriptionCache.has(url)
    ? (SubscriptionCache.get(url) as SubsciptionCacheItem)
    : await (async () => {
        const res = await httpClient.get(url);
        const subsciptionCacheItem: SubsciptionCacheItem = {
          body: res.body,
        };

        if (res.headers['subscription-userinfo']) {
          subsciptionCacheItem.subscriptionUserinfo = parseSubscriptionUserInfo(
            res.headers['subscription-userinfo'] as string,
          );
          logger.debug(
            '%s received subscription userinfo - raw: %s | parsed: %j',
            url,
            res.headers['subscription-userinfo'],
            subsciptionCacheItem.subscriptionUserinfo,
          );
        }

        SubscriptionCache.set(url, subsciptionCacheItem);

        return subsciptionCacheItem;
      })();

  const nodeList = fromBase64(response.body)
    .split('\n')
    .filter((item) => !!item && item.startsWith('ss://'))
    .map(
      (item): ShadowsocksNodeConfig => {
        const nodeConfig = parseSSUri(item);

        if (udpRelay !== void 0) {
          (nodeConfig['udp-relay'] as boolean) = udpRelay;
        }

        return nodeConfig;
      },
    );

  return {
    nodeList,
    subscriptionUserinfo: response.subscriptionUserinfo,
  };
};
