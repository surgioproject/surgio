import { ShadowsocksJsonSubscribeProviderConfig } from '../types';
import { getShadowsocksJSONConfig } from '../utils';
import Provider from './Provider';

export default class ShadowsocksJsonSubscribeProvider extends Provider {
  public readonly url: string;
  public readonly udpRelay?: boolean;

  constructor(config: ShadowsocksJsonSubscribeProviderConfig) {
    super(config);
    this.url = config.url;
    this.udpRelay = config.udpRelay;
  }

  public getNodeList(): ReturnType<typeof getShadowsocksJSONConfig> {
    return getShadowsocksJSONConfig({
      url: this.url,
      udpRelay: this.udpRelay,
    });
  }
}
