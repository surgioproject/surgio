import {
  CommandConfigBeforeNormalize,
  ProviderConfigFactory,
  PossibleProviderConfigType,
} from './types'

export const defineSurgioConfig = (config: CommandConfigBeforeNormalize) =>
  config

export const defineProvider = (
  config: PossibleProviderConfigType | ProviderConfigFactory,
) => config
