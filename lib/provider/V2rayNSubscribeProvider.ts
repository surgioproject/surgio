import Joi from '@hapi/joi';
import { V2rayNSubscribeProviderConfig } from '../types';
import { getV2rayNSubscription } from '../utils';
import Provider from './Provider';

export default class V2rayNSubscribeProvider extends Provider {
  public readonly url: string;

  constructor(config: V2rayNSubscribeProviderConfig) {
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

    // istanbul ignore next
    if (error) {
      throw error;
    }

    this.url = config.url;
  }

  public getNodeList(): ReturnType<typeof getV2rayNSubscription> {
    return getV2rayNSubscription(this.url);
  }
}
