import LRU from 'lru-cache';

import { SubscriptionUserinfo } from '../types';
import { getProviderCacheMaxage } from './env-flag';

export interface SubsciptionCacheItem {
  readonly body: string;
  subscriptionUserinfo?: SubscriptionUserinfo;
}

export const ConfigCache = new LRU<string, string>({
  maxAge: getProviderCacheMaxage(),
  max: 100,
});

export const SubscriptionCache = new LRU<string, SubsciptionCacheItem>({
  maxAge: getProviderCacheMaxage(),
  max: 100,
});
