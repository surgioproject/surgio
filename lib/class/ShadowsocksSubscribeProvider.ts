import Joi from '@hapi/joi';
import { ShadowsocksSubscribeProviderConfig } from '../types';
import { getShadowsocksSubscription } from '../utils';
import Provider from './Provider';

export default class ShadowsocksSubscribeProvider extends Provider {
  public readonly url: string;
  public readonly udpRelay?: boolean;

  constructor(config: ShadowsocksSubscribeProviderConfig) {
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
    })
      .unknown();

    const { error } = schema.validate(config);

    if (error) {
      throw error;
    }

    this.url = config.url;
    this.udpRelay = config.udpRelay;
  }

  public getNodeList(): ReturnType<typeof getShadowsocksSubscription> {
    return getShadowsocksSubscription({
      url: this.url,
      udpRelay: this.udpRelay,
    });
  }
}
