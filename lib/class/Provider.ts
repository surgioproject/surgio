import Joi from '@hapi/joi';

import {
  NodeFilterType,
  NodeNameFilterType,
  ProviderConfig,
  SupportProviderEnum,
  PossibleNodeConfigType,
} from '../types';

let globalPort: number = 61100;

export default class Provider {
  public readonly type: SupportProviderEnum;
  public readonly nodeFilter?: NodeFilterType;
  public readonly netflixFilter?: NodeNameFilterType;
  public readonly youtubePremiumFilter?: NodeNameFilterType;
  public readonly customFilters?: ProviderConfig['customFilters'];
  public readonly addFlag?: boolean;
  public readonly tfo?: boolean;
  private startPort?: number;

  constructor(config: ProviderConfig) {
    const schema = Joi.object({
      type: Joi.string()
        .valid(...Object.values<string>(SupportProviderEnum))
        .required(),
      nodeFilter: Joi.function(),
      netflixFilter: Joi.function(),
      youtubePremiumFilter: Joi.function(),
      customFilters: Joi.object().pattern(Joi.string(), Joi.function()),
      addFlag: Joi.boolean(),
      startPort: Joi.number().integer().min(1024).max(65535),
    })
      .unknown();

    const { error } = schema.validate(config);

    // istanbul ignore next
    if (error) {
      throw error;
    }

    this.type = config.type;
    this.nodeFilter = config.nodeFilter;
    this.netflixFilter = config.netflixFilter;
    this.youtubePremiumFilter = config.youtubePremiumFilter;
    this.customFilters = config.customFilters;
    this.addFlag = config.addFlag;
    this.tfo = config.tfo;
    this.startPort = config.startPort;
  }

  public get nextPort(): number {
    if (this.startPort) {
      return this.startPort++;
    }
    return globalPort++;
  }

  public getNodeList(): Promise<ReadonlyArray<PossibleNodeConfigType>> {
    return Promise.resolve([]);
  };
}
