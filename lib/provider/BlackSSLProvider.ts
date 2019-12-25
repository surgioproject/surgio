// istanbul ignore file

import Joi from '@hapi/joi';
import { BlackSSLProviderConfig } from '../types';
import { getBlackSSLConfig } from '../utils';
import Provider from './Provider';

export default class BlackSSLProvider extends Provider {
  public readonly username: string;
  public readonly password: string;

  constructor(config: BlackSSLProviderConfig) {
    super(config);

    const schema = Joi.object({
      username: Joi
        .string()
        .required(),
      password: Joi
        .string()
        .required(),
    })
      .unknown();

    const { error } = schema.validate(config);

    // istanbul ignore next
    if (error) {
      throw error;
    }

    this.username = config.username;
    this.password = config.password;
  }

  public getNodeList(): ReturnType<typeof getBlackSSLConfig> {
    return getBlackSSLConfig(this.username, this.password);
  }
}
