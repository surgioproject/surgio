import { PossibleProviderConfigType, SupportProviderEnum } from '../types.js'
import { ProviderDefineFunction } from '../configurables.js'
import { getDefaultProviderRuntimeContext } from '../runtime/provider-context.js'
import { getNetworkClashUA } from '../utils/env-flag.js'
import './node-runtime.js'

import ClashProvider from './ClashProvider.js'
import CustomProvider from './CustomProvider.js'
import ShadowsocksJsonSubscribeProvider from './ShadowsocksJsonSubscribeProvider.js'
import ShadowsocksrSubscribeProvider from './ShadowsocksrSubscribeProvider.js'
import ShadowsocksSubscribeProvider from './ShadowsocksSubscribeProvider.js'
import SsdProvider from './SsdProvider.js'
import TrojanProvider from './TrojanProvider.js'
import V2rayNSubscribeProvider from './V2rayNSubscribeProvider.js'
import { createProvider } from './create-provider.js'
import { PossibleProviderType } from './types.js'
import Provider from './Provider.js'

export {
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
export { createProvider }

export async function getProvider(
  name: string,
  config: ReturnType<ProviderDefineFunction<any>> | PossibleProviderConfigType,
): Promise<PossibleProviderType> {
  if (typeof config === 'function') {
    config = await config()
  }

  const provider = await createProvider(
    name,
    config,
    getDefaultProviderRuntimeContext(),
  )

  if (
    provider.type === SupportProviderEnum.Clash &&
    provider.config.requestUserAgent === 'clash'
  ) {
    provider.config.requestUserAgent = getNetworkClashUA()
  }

  return provider
}
