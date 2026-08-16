import { SupportProviderEnum } from '../types.js'

import ClashProvider from './ClashProvider.js'
import CustomProvider from './CustomProvider.js'
import ShadowsocksJsonSubscribeProvider from './ShadowsocksJsonSubscribeProvider.js'
import ShadowsocksrSubscribeProvider from './ShadowsocksrSubscribeProvider.js'
import ShadowsocksSubscribeProvider from './ShadowsocksSubscribeProvider.js'
import SsdProvider from './SsdProvider.js'
import TrojanProvider from './TrojanProvider.js'
import V2rayNSubscribeProvider from './V2rayNSubscribeProvider.js'

import type { PossibleProviderConfigType } from '../types.js'
import type { ProviderRuntimeContext } from '../runtime/types.js'
import type { PossibleProviderType } from './types.js'

export const createProvider = async (
  name: string,
  definition:
    | PossibleProviderConfigType
    | (() => PossibleProviderConfigType | Promise<PossibleProviderConfigType>),
  runtime: ProviderRuntimeContext,
): Promise<PossibleProviderType> => {
  const config =
    typeof definition === 'function' ? await definition() : definition

  const provider = (() => {
    switch (config.type) {
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
  })()

  return provider.useRuntime(runtime) as PossibleProviderType
}
