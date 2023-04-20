import { CommandConfigBeforeNormalize, ProviderConfigFactory } from '../types';
import { PossibleProviderConfigType } from '../types';

export const defineSurgioConfig = (config: CommandConfigBeforeNormalize) =>
  config;

export const defineProvider = (
  config: PossibleProviderConfigType | ProviderConfigFactory,
) => config;
