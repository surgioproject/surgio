import Joi from '@hapi/joi';

import {
  ProviderConfig,
  SupportProviderEnum,
  PossibleNodeConfigType,
} from '../types';

let globalPort: number = 61100;

export default class Provider {
  public readonly type: SupportProviderEnum;
  public readonly nodeFilter?: ProviderConfig['nodeFilter'];
  public readonly netflixFilter?: ProviderConfig['netflixFilter'];
  public readonly youtubePremiumFilter?: ProviderConfig['youtubePremiumFilter'];
  public readonly customFilters?: ProviderConfig['customFilters'];
  public readonly addFlag?: boolean;
  public readonly tfo?: boolean;
  public readonly mptcp?: boolean;
  public readonly renameNode?: ProviderConfig['renameNode'];
  private startPort?: number;

  constructor(public name: string, config: ProviderConfig) {
    const schema = Joi.object({
      type: Joi.string()
        .valid(...Object.values<string>(SupportProviderEnum))
        .required(),
      nodeFilter: Joi.any().allow(Joi.function(), Joi.object({ filter: Joi.function(), supportSort: Joi.boolean() })),
      netflixFilter: Joi.any().allow(Joi.function(), Joi.object({ filter: Joi.function(), supportSort: Joi.boolean() })),
      youtubePremiumFilter: Joi.any().allow(Joi.function(), Joi.object({ filter: Joi.function(), supportSort: Joi.boolean() })),
      customFilters: Joi.object()
        .pattern(
          Joi.string(),
          Joi.any().allow(Joi.function(), Joi.object({ filter: Joi.function(), supportSort: Joi.boolean() }))
        ),
      addFlag: Joi.boolean(),
      mptcp: Joi.boolean(),
      tfo: Joi.boolean(),
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
    this.mptcp = config.mptcp;
    this.startPort = config.startPort;
    this.renameNode = config.renameNode;
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
