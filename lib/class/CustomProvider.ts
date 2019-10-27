import Joi from '@hapi/joi';
import { CustomProviderConfig, NodeTypeEnum, PossibleNodeConfigType } from '../types';
import Provider from './Provider';

export default class CustomProvider extends Provider {
  public readonly nodeList: ReadonlyArray<PossibleNodeConfigType>;

  constructor(config: CustomProviderConfig) {
    super(config);

    const nodeSchema = Joi.object({
      type: Joi.string()
        .valid(...Object.values<string>(NodeTypeEnum))
        .required(),
      nodeName: Joi.string().required(),
      enable: Joi.boolean(),
    }).unknown();
    const schema = Joi.object({
      nodeList: Joi
        .array()
        .items(nodeSchema)
        .required(),
    })
      .unknown();

    const { error } = schema.validate(config);

    if (error) {
      throw error;
    }

    this.nodeList = config.nodeList;
  }

  public async getNodeList(): Promise<ReadonlyArray<PossibleNodeConfigType>> {
    return this.nodeList;
  }
}
