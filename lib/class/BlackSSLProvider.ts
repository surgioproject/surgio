import { BlackSSLProviderConfig } from '../types';
import { getBlackSSLConfig } from '../utils';
import Provider from './Provider';

export default class BlackSSLProvider extends Provider {
  public readonly username: string;
  public readonly password: string;

  constructor(config: BlackSSLProviderConfig) {
    super(config);
    this.username = config.username;
    this.password = config.password;
  }

  public getNodeList(): ReturnType<typeof getBlackSSLConfig> {
    return getBlackSSLConfig(this);
  }
}
