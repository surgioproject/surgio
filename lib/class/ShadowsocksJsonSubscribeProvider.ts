import Joi from '@hapi/joi';
import { ShadowsocksJsonSubscribeProviderConfig, SupportProviderEnum } from '../types';
import { getShadowsocksJSONConfig } from '../utils';
import Provider from './Provider';

export default class ShadowsocksJsonSubscribeProvider extends Provider {
  public readonly url: string;
  public readonly udpRelay?: boolean;

  constructor(config: ShadowsocksJsonSubscribeProviderConfig) {
    super(config);

    const schema = Joi.object({
      url: Joi
        .string()
        .uri({
          scheme: [
            /https?/,
          ],
        })
        .required(),
      udpRelay: Joi.boolean(),
    });

    schema.validate(config);

    this.url = config.url;
    this.udpRelay = config.udpRelay;
  }

  public getNodeList(): ReturnType<typeof getShadowsocksJSONConfig> {
    return getShadowsocksJSONConfig({
      url: this.url,
      udpRelay: this.udpRelay,
    });
  }
}
