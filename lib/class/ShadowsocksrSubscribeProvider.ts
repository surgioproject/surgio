import Joi from '@hapi/joi';
import { ShadowsocksrSubscribeProviderConfig } from '../types';
import { getShadowsocksrSubscription } from '../utils';
import Provider from './Provider';

export default class ShadowsocksrSubscribeProvider extends Provider {
  public readonly url: string;

  constructor(config: ShadowsocksrSubscribeProviderConfig) {
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
    })
      .unknown();

    const { error } = schema.validate(config);

    if (error) {
      throw error;
    }

    this.url = config.url;
  }

  public getNodeList(): ReturnType<typeof getShadowsocksrSubscription> {
    return getShadowsocksrSubscription(this.url);
  }
}
