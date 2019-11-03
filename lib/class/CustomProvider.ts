import Joi from '@hapi/joi';
import * as util from 'util';
import { DEP002 } from '../misc/deprecation';
import { CustomProviderConfig, NodeTypeEnum, PossibleNodeConfigType } from '../types';
import Provider from './Provider';

export default class CustomProvider extends Provider {
  public readonly nodeList: ReadonlyArray<any>;

  constructor(config: CustomProviderConfig) {
    super(config);

    const nodeSchema = Joi.object({
      type: Joi.string()
        .valid(...Object.values<string>(NodeTypeEnum))
        .required(),
      nodeName: Joi.string().required(),
      enable: Joi.boolean(),
    })
      .unknown();
    const schema = Joi.object({
      nodeList: Joi
        .array()
        .items(nodeSchema)
        .required(),
    })
      .unknown();

    const { error } = schema.validate(config);

    // istanbul ignore next
    if (error) {
      throw error;
    }

    this.nodeList = config.nodeList;
  }

  public async getNodeList(): Promise<ReadonlyArray<PossibleNodeConfigType>> {
    return this.nodeList.map(item => {
      if (item.type === NodeTypeEnum.Shadowsocks) {
        // 兼容字符串 true 和 false 的写法，会弃用
        if (typeof item['udp-relay'] === 'string') {
          notifyDepUdpRelay();
          item['udp-relay'] = item['udp-relay'] === 'true';
        }
      }
      return item;
    });
  }
}

const notifyDepUdpRelay = util.deprecate(() => {
  // do nothing
}, DEP002, 'DEP002');
