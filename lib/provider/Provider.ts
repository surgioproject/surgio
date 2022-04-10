import { createLogger } from '@surgio/logger';
import Joi from 'joi';

import {
  ProviderConfig,
  SupportProviderEnum,
  PossibleNodeConfigType,
  SubscriptionUserinfo,
} from '../types';
import { SubsciptionCacheItem, SubscriptionCache } from '../utils/cache';
import httpClient, { getUserAgent } from '../utils/http-client';
import { parseSubscriptionUserInfo } from '../utils/subscription';
import { toBase64 } from '../utils';

const logger = createLogger({
  service: 'surgio:Provider',
});

export default class Provider {
  public readonly type: SupportProviderEnum;
  public readonly nodeFilter?: ProviderConfig['nodeFilter'];
  public readonly netflixFilter?: ProviderConfig['netflixFilter'];
  public readonly youtubePremiumFilter?: ProviderConfig['youtubePremiumFilter'];
  public readonly customFilters?: ProviderConfig['customFilters'];
  public readonly addFlag?: boolean;
  public readonly removeExistingFlag?: boolean;
  public readonly tfo?: boolean;
  public readonly mptcp?: boolean;
  public readonly renameNode?: ProviderConfig['renameNode'];
  public readonly relayUrl?: boolean | string;
  // 是否支持在订阅中获取用户流量信息
  public supportGetSubscriptionUserInfo: boolean;
  // External Provider 的起始端口，Surge 配置中使用
  public startPort?: number;

  constructor(public name: string, config: ProviderConfig) {
    const schema = Joi.object({
      type: Joi.string()
        .valid(...Object.values<string>(SupportProviderEnum))
        .required(),
      nodeFilter: Joi.any().allow(
        Joi.function(),
        Joi.object({
          filter: Joi.function(),
          supportSort: Joi.boolean().strict(),
        }),
      ),
      netflixFilter: Joi.any().allow(
        Joi.function(),
        Joi.object({
          filter: Joi.function(),
          supportSort: Joi.boolean().strict(),
        }),
      ),
      youtubePremiumFilter: Joi.any().allow(
        Joi.function(),
        Joi.object({
          filter: Joi.function(),
          supportSort: Joi.boolean().strict(),
        }),
      ),
      customFilters: Joi.object().pattern(
        Joi.string(),
        Joi.any().allow(
          Joi.function(),
          Joi.object({
            filter: Joi.function(),
            supportSort: Joi.boolean().strict(),
          }),
        ),
      ),
      addFlag: Joi.boolean().strict(),
      removeExistingFlag: Joi.boolean().strict(),
      mptcp: Joi.boolean().strict(),
      tfo: Joi.boolean().strict(),
      startPort: Joi.number().integer().min(1024).max(65535),
      relayUrl: [Joi.boolean().strict(), Joi.string()],
      renameNode: Joi.function(),
    }).unknown();

    const { error } = schema.validate(config);

    // istanbul ignore next
    if (error) {
      throw error;
    }

    this.supportGetSubscriptionUserInfo = false;

    [
      'type',
      'nodeFilter',
      'netflixFilter',
      'youtubePremiumFilter',
      'customFilters',
      'addFlag',
      'removeExistingFlag',
      'tfo',
      'mptcp',
      'startPort',
      'renameNode',
      'relayUrl',
    ].forEach((key) => {
      this[key] = config[key];
    });
  }

  static async requestCacheableResource(
    url: string,
    options: {
      requestUserAgent?: string;
    } = {},
  ): Promise<SubsciptionCacheItem> {
    const cacheKey = `${toBase64(
      getUserAgent(options.requestUserAgent || ''),
    )}:${url}`;

    return SubscriptionCache.has(cacheKey)
      ? (SubscriptionCache.get(cacheKey) as SubsciptionCacheItem)
      : await (async () => {
          const headers = {};

          if (options.requestUserAgent) {
            headers['user-agent'] = options.requestUserAgent;
          }

          const res = await httpClient.get(url, {
            responseType: 'text',
            headers,
          });
          const subsciptionCacheItem: SubsciptionCacheItem = {
            body: res.body,
          };

          if (res.headers['subscription-userinfo']) {
            subsciptionCacheItem.subscriptionUserinfo =
              parseSubscriptionUserInfo(
                res.headers['subscription-userinfo'] as string,
              );
            logger.debug(
              '%s received subscription userinfo - raw: %s | parsed: %j',
              url,
              res.headers['subscription-userinfo'],
              subsciptionCacheItem.subscriptionUserinfo,
            );
          }

          SubscriptionCache.set(cacheKey, subsciptionCacheItem);

          return subsciptionCacheItem;
        })();
  }

  public get nextPort(): number {
    if (this.startPort) {
      return this.startPort++;
    }
    return 0;
  }

  // istanbul ignore next
  public async getSubscriptionUserInfo(): Promise<
    SubscriptionUserinfo | undefined
  > {
    throw new Error('此 Provider 不支持该功能');
  }

  // istanbul ignore next
  public getNodeList({}: { requestUserAgent?: string } = {}): Promise<
    ReadonlyArray<PossibleNodeConfigType>
  > {
    return Promise.resolve([]);
  }
}
