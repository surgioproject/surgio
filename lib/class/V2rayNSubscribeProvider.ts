import { V2rayNSubscribeProviderConfig } from '../types';
import { getV2rayNSubscription } from '../utils';
import Provider from './Provider';

export default class V2rayNSubscribeProvider extends Provider {
  public readonly url: string;

  constructor(config: V2rayNSubscribeProviderConfig) {
    super(config);
    this.url = config.url;
  }

  public getNodeList(): ReturnType<typeof getV2rayNSubscription> {
    return getV2rayNSubscription(this);
  }
}
