import assert from "assert";

import BlackSSLProvider from '../provider/BlackSSLProvider';
import ClashProvider from '../provider/ClashProvider';
import CustomProvider from '../provider/CustomProvider';
import ShadowsocksJsonSubscribeProvider from '../provider/ShadowsocksJsonSubscribeProvider';
import ShadowsocksrSubscribeProvider from '../provider/ShadowsocksrSubscribeProvider';
import ShadowsocksSubscribeProvider from '../provider/ShadowsocksSubscribeProvider';
import V2rayNSubscribeProvider from '../provider/V2rayNSubscribeProvider';
import { SupportProviderEnum } from '../types';

export default function(config: any): BlackSSLProvider|ShadowsocksJsonSubscribeProvider|ShadowsocksSubscribeProvider|CustomProvider|V2rayNSubscribeProvider|ShadowsocksrSubscribeProvider|ClashProvider {
  switch (config.type) {
    case SupportProviderEnum.BlackSSL:
      return new BlackSSLProvider(config);

    case SupportProviderEnum.ShadowsocksJsonSubscribe:
      return new ShadowsocksJsonSubscribeProvider(config);

    case SupportProviderEnum.ShadowsocksSubscribe:
      return new ShadowsocksSubscribeProvider(config);

    case SupportProviderEnum.ShadowsocksrSubscribe:
      return new ShadowsocksrSubscribeProvider(config);

    case SupportProviderEnum.Custom: {
      return new CustomProvider(config);
    }

    case SupportProviderEnum.V2rayNSubscribe:
      return new V2rayNSubscribeProvider(config);

    case SupportProviderEnum.Clash:
      return new ClashProvider(config);

    default:
      throw new Error(`Unsupported provider type: ${config.type}`);
  }
}
