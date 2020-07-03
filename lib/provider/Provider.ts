import Joi from '@hapi/joi';

import {
  ProviderConfig,
  SupportProviderEnum,
  PossibleNodeConfigType, SubscriptionUserinfo,
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
  public readonly relayUrl?: boolean;
  // 是否支持在订阅中获取用户流量信息
  public supportGetSubscriptionUserInfo: boolean;
  // External Provider 的起始端口，Surge 配置中使用
  private startPort?: number;

  constructor(public name: string, config: ProviderConfig) {
    const schema = Joi.object({
      type: Joi.string()
        .valid(...Object.values<string>(SupportProviderEnum))
        .required(),
      nodeFilter: Joi.any().allow(Joi.function(), Joi.object({ filter: Joi.function(), supportSort: Joi.boolean().strict() })),
      netflixFilter: Joi.any().allow(Joi.function(), Joi.object({ filter: Joi.function(), supportSort: Joi.boolean().strict() })),
      youtubePremiumFilter: Joi.any().allow(Joi.function(), Joi.object({ filter: Joi.function(), supportSort: Joi.boolean().strict() })),
      customFilters: Joi.object()
        .pattern(
          Joi.string(),
          Joi.any().allow(Joi.function(), Joi.object({ filter: Joi.function(), supportSort: Joi.boolean().strict() }))
        ),
      addFlag: Joi.boolean().strict(),
      mptcp: Joi.boolean().strict(),
      tfo: Joi.boolean().strict(),
      startPort: Joi.number().integer().min(1024).max(65535),
      relayUrl: Joi.boolean().strict(),
      renameNode: Joi.function(),
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
    this.relayUrl = config.relayUrl;
    this.supportGetSubscriptionUserInfo = false;
  }

  public get nextPort(): number {
    if (this.startPort) {
      return this.startPort++;
    }
    return globalPort++;
  }

  // istanbul ignore next
  public async getSubscriptionUserInfo(): Promise<SubscriptionUserinfo|undefined> {
    throw new Error('此 Provider 不支持该功能');
  }

  // istanbul ignore next
  public getNodeList(): Promise<ReadonlyArray<PossibleNodeConfigType>> {
    return Promise.resolve([]);
  };
}
