import Joi from 'joi';
import {
  CustomProviderConfig,
  NodeTypeEnum,
  PossibleNodeConfigType,
} from '../types';
import Provider from './Provider';

export default class CustomProvider extends Provider {
  public readonly nodeList: ReadonlyArray<any>;

  constructor(name: string, config: CustomProviderConfig) {
    super(name, config);

    const nodeSchema = Joi.object({
      type: Joi.string()
        .valid(...Object.values<string>(NodeTypeEnum))
        .required(),
      nodeName: Joi.string().required(),
      enable: Joi.boolean().strict(),
      tfo: Joi.boolean().strict(),
      mptcp: Joi.boolean().strict(),
      binPath: Joi.string(),
      localPort: Joi.number(),
      underlyingProxy: Joi.string(),
      skipCertVerify: Joi.boolean().strict(),
      sni: Joi.string(),
      alpn: Joi.array().items(Joi.string()),
    }).unknown();
    const schema = Joi.object({
      nodeList: Joi.array().items(nodeSchema).required(),
    }).unknown();

    const { error } = schema.validate(config);

    // istanbul ignore next
    if (error) {
      throw error;
    }

    this.nodeList = config.nodeList;
  }

  public async getNodeList(): Promise<ReadonlyArray<PossibleNodeConfigType>> {
    const udpRelayCheckSchema = Joi.object({
      'udp-relay': Joi.bool().strict(),
    }).unknown();

    return this.nodeList.map((item) => {
      const { error: udpRelayCheckError } = udpRelayCheckSchema.validate(item);
      const lowercaseKeys = ['wsHeaders'];

      // istanbul ignore next
      if (udpRelayCheckError) {
        throw udpRelayCheckError;
      }

      lowercaseKeys.forEach((key) => {
        if (item[key]) {
          item[key] = Object.keys(item[key]).reduce((acc, curr) => {
            acc[curr.toLowerCase()] = item[key][curr];
            return acc;
          }, {});
        }
      });

      return item;
    });
  }
}
