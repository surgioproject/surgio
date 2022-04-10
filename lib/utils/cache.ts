import NodeCache from 'node-cache';

import { SubscriptionUserinfo } from '../types';
import { getProviderCacheMaxage } from './env-flag';
import { msToSeconds } from './index';

export interface SubsciptionCacheItem {
  readonly body: string;
  subscriptionUserinfo?: SubscriptionUserinfo;
}

export const ConfigCache = new NodeCache({
  stdTTL: msToSeconds(getProviderCacheMaxage()),
  maxKeys: 300,
  useClones: false,
});

export const SubscriptionCache = new NodeCache({
  stdTTL: msToSeconds(getProviderCacheMaxage()),
  maxKeys: 300,
  useClones: false,
});

export const cleanCaches = () => {
  ConfigCache.flushAll();
  SubscriptionCache.flushAll();
};
