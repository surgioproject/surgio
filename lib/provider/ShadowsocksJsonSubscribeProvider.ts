import Joi from '@hapi/joi';
import { ShadowsocksJsonSubscribeProviderConfig } from '../types';
import { getShadowsocksJSONConfig } from '../utils';
import { RELAY_SERVICE } from '../utils/constant';
import Provider from './Provider';

export default class ShadowsocksJsonSubscribeProvider extends Provider {
  public readonly udpRelay?: boolean;
  private readonly _url: string;

  constructor(name: string, config: ShadowsocksJsonSubscribeProviderConfig) {
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
      udpRelay: Joi.boolean().strict(),
    })
      .unknown();

    const { error } = schema.validate(config);

    // istanbul ignore next
    if (error) {
      throw error;
    }

    this._url = config.url;
    this.udpRelay = config.udpRelay;
  }

  // istanbul ignore next
  public get url(): string {
    if (this.relayUrl) {
      return `${RELAY_SERVICE}${this._url}`;
    }
    return this._url;
  }

  public getNodeList(): ReturnType<typeof getShadowsocksJSONConfig> {
    return getShadowsocksJSONConfig(this.url, this.udpRelay);
  }
}
