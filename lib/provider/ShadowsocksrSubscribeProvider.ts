import Joi from '@hapi/joi';
import { ShadowsocksrSubscribeProviderConfig } from '../types';
import { getShadowsocksrSubscription } from '../utils';
import Provider from './Provider';

export default class ShadowsocksrSubscribeProvider extends Provider {
  public readonly url: string;
  public readonly udpRelay?: boolean;

  constructor(name: string, config: ShadowsocksrSubscribeProviderConfig) {
    super(name, config);

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

    // istanbul ignore next
    if (error) {
      throw error;
    }

    this.url = config.url;
    this.udpRelay = config.udpRelay;
  }

  public getNodeList(): ReturnType<typeof getShadowsocksrSubscription> {
    return getShadowsocksrSubscription(this.url, this.udpRelay);
  }
}
