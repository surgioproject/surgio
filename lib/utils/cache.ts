import LRU from 'lru-cache';

import { SubscriptionUserinfo } from '../types';
import { PROVIDER_CACHE_MAXAGE } from './constant';

export interface SubsciptionCacheItem {
  readonly body: string;
  subscriptionUserinfo?: SubscriptionUserinfo;
}

export const ConfigCache = new LRU<string, string>({
  maxAge: PROVIDER_CACHE_MAXAGE,
  max: 100,
});

export const SubscriptionCache = new LRU<string, SubsciptionCacheItem>({
  maxAge: PROVIDER_CACHE_MAXAGE,
  max: 100,
});
