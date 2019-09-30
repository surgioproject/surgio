import assert from "assert";

import BlackSSLProvider from '../class/BlackSSLProvider';
import CustomProvider from '../class/CustomProvider';
import ShadowsocksJsonSubscribeProvider from '../class/ShadowsocksJsonSubscribeProvider';
import ShadowsocksrSubscribeProvider from '../class/ShadowsocksrSubscribeProvider';
import ShadowsocksSubscribeProvider from '../class/ShadowsocksSubscribeProvider';
import V2rayNSubscribeProvider from '../class/V2rayNSubscribeProvider';
import { SupportProviderEnum } from '../types';

export default function(config: any): BlackSSLProvider|ShadowsocksJsonSubscribeProvider|ShadowsocksSubscribeProvider|CustomProvider|V2rayNSubscribeProvider|ShadowsocksrSubscribeProvider {
  assert(config.type, 'You must specify a type.');

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

    default:
      throw new Error(`Unsupported provider type: ${config.type}`);
  }
}
