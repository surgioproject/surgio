import { SupportProviderEnum } from '../types';
import BlackSSLProvider from './BlackSSLProvider';
import ClashProvider from './ClashProvider';
import CustomProvider from './CustomProvider';
import ShadowsocksJsonSubscribeProvider from './ShadowsocksJsonSubscribeProvider';
import ShadowsocksrSubscribeProvider from './ShadowsocksrSubscribeProvider';
import ShadowsocksSubscribeProvider from './ShadowsocksSubscribeProvider';
import SsdProvider from './SsdProvider';
import V2rayNSubscribeProvider from './V2rayNSubscribeProvider';

export function getProvider(
  name: string,
  config: any,
):
  | BlackSSLProvider
  | ShadowsocksJsonSubscribeProvider
  | ShadowsocksSubscribeProvider
  | CustomProvider
  | V2rayNSubscribeProvider
  | ShadowsocksrSubscribeProvider
  | ClashProvider
  | SsdProvider {
  switch (config.type) {
    case SupportProviderEnum.BlackSSL:
      return new BlackSSLProvider(name, config);

    case SupportProviderEnum.ShadowsocksJsonSubscribe:
      return new ShadowsocksJsonSubscribeProvider(name, config);

    case SupportProviderEnum.ShadowsocksSubscribe:
      return new ShadowsocksSubscribeProvider(name, config);

    case SupportProviderEnum.ShadowsocksrSubscribe:
      return new ShadowsocksrSubscribeProvider(name, config);

    case SupportProviderEnum.Custom: {
      return new CustomProvider(name, config);
    }

    case SupportProviderEnum.V2rayNSubscribe:
      return new V2rayNSubscribeProvider(name, config);

    case SupportProviderEnum.Clash:
      return new ClashProvider(name, config);

    case SupportProviderEnum.Ssd:
      return new SsdProvider(name, config);

    default:
      throw new Error(`Unsupported provider type: ${config.type}`);
  }
}
