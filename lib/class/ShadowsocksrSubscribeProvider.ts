import { ShadowsocksrSubscribeProviderConfig } from '../types';
import { getShadowsocksrSubscription } from '../utils';
import Provider from './Provider';

export default class ShadowsocksrSubscribeProvider extends Provider {
  public readonly url: string;

  constructor(config: ShadowsocksrSubscribeProviderConfig) {
    super(config);
    this.url = config.url;
  }

  public getNodeList(): ReturnType<typeof getShadowsocksrSubscription> {
    return getShadowsocksrSubscription(this);
  }
}
