import Joi from '@hapi/joi';
import { CustomProviderConfig, NodeTypeEnum, PossibleNodeConfigType } from '../types';
import Provider from './Provider';

export default class CustomProvider extends Provider {
  public readonly nodeList: ReadonlyArray<PossibleNodeConfigType>;

  constructor(config: CustomProviderConfig) {
    super(config);

    const nodeSchema = Joi.object({
      type: Joi.string()
        .allow([
          NodeTypeEnum.Shadowsocksr,
          NodeTypeEnum.Shadowsocks,
          NodeTypeEnum.Vmess,
          NodeTypeEnum.HTTPS,
          NodeTypeEnum.Snell,
        ])
        .required(),
      nodeName: Joi.string().required(),
      enable: Joi.boolean(),
    });
    const schema = Joi.object({
      nodeList: Joi
        .array()
        .items(nodeSchema)
        .required(),
    });

    schema.validate(config);

    this.nodeList = config.nodeList;
  }

  public async getNodeList(): Promise<ReadonlyArray<PossibleNodeConfigType>> {
    return this.nodeList;
  }
}
