import {
  ClashProviderConfig,
  CustomProviderConfig,
  PossibleProviderConfigType,
  ShadowsocksJsonSubscribeProviderConfig,
  ShadowsocksrSubscribeProviderConfig,
  ShadowsocksSubscribeProviderConfig,
  SsdProviderConfig,
  SupportProviderEnum,
  TrojanProviderConfig,
  V2rayNSubscribeProviderConfig,
} from './types.js'
export { defineSurgioProject, env } from './project/core.js'

export type ProviderDefineFunction<
  T extends PossibleProviderConfigType,
  U = Omit<T, 'type'>,
> = (config: U) => T

export const defineClashProvider: ProviderDefineFunction<
  ClashProviderConfig
> = (config) => ({
  ...config,
  type: SupportProviderEnum.Clash,
})

export const defineCustomProvider: ProviderDefineFunction<
  CustomProviderConfig
> = (config) => ({
  ...config,
  type: SupportProviderEnum.Custom,
})

export const defineShadowsocksJsonSubscribeProvider: ProviderDefineFunction<
  ShadowsocksJsonSubscribeProviderConfig
> = (config) => ({
  ...config,
  type: SupportProviderEnum.ShadowsocksJsonSubscribe,
})

export const defineShadowsocksSubscribeProvider: ProviderDefineFunction<
  ShadowsocksSubscribeProviderConfig
> = (config) => ({
  ...config,
  type: SupportProviderEnum.ShadowsocksSubscribe,
})

export const defineShadowsocksrSubscribeProvider: ProviderDefineFunction<
  ShadowsocksrSubscribeProviderConfig
> = (config) => ({
  ...config,
  type: SupportProviderEnum.ShadowsocksrSubscribe,
})

export const defineSsdProvider: ProviderDefineFunction<SsdProviderConfig> = (
  config,
) => ({
  ...config,
  type: SupportProviderEnum.Ssd,
})

export const defineTrojanProvider: ProviderDefineFunction<
  TrojanProviderConfig
> = (config) => ({
  ...config,
  type: SupportProviderEnum.Trojan,
})

export const defineV2rayNSubscribeProvider: ProviderDefineFunction<
  V2rayNSubscribeProviderConfig
> = (config) => ({
  ...config,
  type: SupportProviderEnum.V2rayNSubscribe,
})
