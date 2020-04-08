import Joi from '@hapi/joi';
import { createLogger } from '@surgio/logger';
import assert from 'assert';
import got from 'got';

import { ShadowsocksrNodeConfig, ShadowsocksrSubscribeProviderConfig, SubscriptionUserinfo } from '../types';
import { fromBase64 } from '../utils';
import { parseSubscriptionNode, parseSubscriptionUserInfo } from '../utils/subscription';
import { SubsciptionCacheItem, SubscriptionCache } from '../utils/cache';
import { NETWORK_TIMEOUT, RELAY_SERVICE } from '../utils/constant';
import { parseSSRUri } from '../utils/ssr';
import Provider from './Provider';

const logger = createLogger({ service: 'surgio:ShadowsocksrSubscribeProvider' });

export default class ShadowsocksrSubscribeProvider extends Provider {
  public readonly udpRelay?: boolean;
  private readonly _url: string;

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

    this._url = config.url;
    this.udpRelay = config.udpRelay;
    this.supportGetSubscriptionUserInfo = true;
  }

  // istanbul ignore next
  public get url(): string {
    if (this.relayUrl) {
      return `${RELAY_SERVICE}${this._url}`;
    }
    return this._url;
  }

  public async getSubscriptionUserInfo(): Promise<SubscriptionUserinfo|undefined> {
    const { subscriptionUserinfo } = await getShadowsocksrSubscription(this.url, this.udpRelay);

    if (subscriptionUserinfo) {
      return subscriptionUserinfo;
    }
    return undefined;
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

    if (
      !response.subscriptionUserinfo &&
      nodeList[0].nodeName.includes('剩余流量')
    ) {
      const dataNode = nodeList[0];
      const expireNode = nodeList[1];
      response.subscriptionUserinfo = parseSubscriptionNode(dataNode.nodeName, expireNode.nodeName);
      logger.debug(
        '%s received subscription node - raw: %s %s | parsed: %j',
        url,
        dataNode.nodeName,
        expireNode.nodeName,
        response.subscriptionUserinfo
      );
    }

    return {
      nodeList,
      subscriptionUserinfo: response.subscriptionUserinfo,
    };
  }

  return await requestConfigFromRemote();
};

