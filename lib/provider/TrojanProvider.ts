import Joi from 'joi';
import assert from 'assert';
import { createLogger } from '@surgio/logger';

import {
  SubscriptionUserinfo,
  TrojanNodeConfig,
  TrojanProviderConfig,
} from '../types';
import { fromBase64 } from '../utils';
import relayableUrl from '../utils/relayable-url';
import { parseTrojanUri } from '../utils/trojan';
import Provider from './Provider';

const logger = createLogger({
  service: 'surgio:TrojanProvider',
});

export default class TrojanProvider extends Provider {
  public readonly _url: string;
  public readonly udpRelay?: boolean;
  public readonly tls13?: boolean;

  constructor(name: string, config: TrojanProviderConfig) {
    super(name, config);

    const schema = Joi.object({
      url: Joi.string()
        .uri({
          scheme: [/https?/],
        })
        .required(),
      udpRelay: Joi.bool().strict(),
      tls13: Joi.bool().strict(),
    }).unknown();

    const { error } = schema.validate(config);

    // istanbul ignore next
    if (error) {
      throw error;
    }

    this._url = config.url;
    this.udpRelay = config.udpRelay;
    this.tls13 = config.tls13;
    this.supportGetSubscriptionUserInfo = true;
  }

  // istanbul ignore next
  public get url(): string {
    return relayableUrl(this._url, this.relayUrl);
  }

  public async getSubscriptionUserInfo(): Promise<
    SubscriptionUserinfo | undefined
  > {
    const { subscriptionUserinfo } = await getTrojanSubscription({
      url: this.url,
      udpRelay: this.udpRelay,
      tls13: this.tls13,
    });

    if (subscriptionUserinfo) {
      return subscriptionUserinfo;
    }
    return void 0;
  }

  public async getNodeList({
    requestUserAgent,
  }: { requestUserAgent?: string } = {}): Promise<
    ReadonlyArray<TrojanNodeConfig>
  > {
    const { nodeList } = await getTrojanSubscription({
      url: this.url,
      udpRelay: this.udpRelay,
      tls13: this.tls13,
      requestUserAgent,
    });

    return nodeList;
  }
}

/**
 * @see https://github.com/trojan-gfw/trojan-url/blob/master/trojan-url.py
 */
export const getTrojanSubscription = async ({
  url,
  udpRelay,
  tls13,
  requestUserAgent,
}: {
  url: string;
  udpRelay?: boolean;
  tls13?: boolean;
  requestUserAgent?: string;
}): Promise<{
  readonly nodeList: ReadonlyArray<TrojanNodeConfig>;
  readonly subscriptionUserinfo?: SubscriptionUserinfo;
}> => {
  assert(url, '未指定订阅地址 url');

  const response = await Provider.requestCacheableResource(url, {
    requestUserAgent: requestUserAgent || 'shadowrocket',
  });
  const config = fromBase64(response.body);
  const nodeList = config
    .split('\n')
    .filter((item) => !!item && item.startsWith('trojan://'))
    .map((item): TrojanNodeConfig => {
      const nodeConfig = parseTrojanUri(item);

      return {
        ...nodeConfig,
        'udp-relay': udpRelay,
        tls13,
      };
    });

  return {
    nodeList,
    subscriptionUserinfo: response.subscriptionUserinfo,
  };
};
