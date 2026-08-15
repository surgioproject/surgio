import { PossibleProviderConfigType, SupportProviderEnum } from '../types.js'
import { ProviderDefineFunction } from '../configurables.js'

import BlackSSLProvider from './BlackSSLProvider.js'
import ClashProvider from './ClashProvider.js'
import CustomProvider from './CustomProvider.js'
import ShadowsocksJsonSubscribeProvider from './ShadowsocksJsonSubscribeProvider.js'
import ShadowsocksrSubscribeProvider from './ShadowsocksrSubscribeProvider.js'
import ShadowsocksSubscribeProvider from './ShadowsocksSubscribeProvider.js'
import SsdProvider from './SsdProvider.js'
import TrojanProvider from './TrojanProvider.js'
import V2rayNSubscribeProvider from './V2rayNSubscribeProvider.js'
import { PossibleProviderType } from './types.js'
import Provider from './Provider.js'

export {
  BlackSSLProvider,
  ClashProvider,
  CustomProvider,
  ShadowsocksJsonSubscribeProvider,
  ShadowsocksrSubscribeProvider,
  ShadowsocksSubscribeProvider,
  SsdProvider,
  TrojanProvider,
  V2rayNSubscribeProvider,
}

export type { Provider }
export type * from './types.js'

export async function getProvider(
  name: string,
  config: ReturnType<ProviderDefineFunction<any>> | PossibleProviderConfigType,
): Promise<PossibleProviderType> {
  if (typeof config === 'function') {
    config = await config()
  }

  switch (config.type) {
    case SupportProviderEnum.BlackSSL:
      return new BlackSSLProvider(name, config)

    case SupportProviderEnum.ShadowsocksJsonSubscribe:
      return new ShadowsocksJsonSubscribeProvider(name, config)

    case SupportProviderEnum.ShadowsocksSubscribe:
      return new ShadowsocksSubscribeProvider(name, config)

    case SupportProviderEnum.ShadowsocksrSubscribe:
      return new ShadowsocksrSubscribeProvider(name, config)

    case SupportProviderEnum.Custom:
      return new CustomProvider(name, config)

    case SupportProviderEnum.V2rayNSubscribe:
      return new V2rayNSubscribeProvider(name, config)

    case SupportProviderEnum.Clash:
      return new ClashProvider(name, config)

    case SupportProviderEnum.Ssd:
      return new SsdProvider(name, config)

    case SupportProviderEnum.Trojan:
      return new TrojanProvider(name, config)

    default:
      throw new Error(`Unsupported provider type: ${(config as any).type}`)
  }
}
