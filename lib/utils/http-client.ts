import got from 'got';
import HttpAgent, { HttpsAgent } from 'agentkeepalive';

import { NETWORK_SURGIO_UA } from '../constant';
import { getNetworkRetry, getNetworkTimeout } from './env-flag';

const pkg = require('../../package.json');

export const getUserAgent = (str?: string): string =>
  `${str ? str + ' ' : ''}${NETWORK_SURGIO_UA}/${pkg.version}`;

const httpClient = got.extend({
  timeout: getNetworkTimeout(),
  retry: getNetworkRetry(),
  headers: {
    'user-agent': getUserAgent(),
  },
  agent: {
    http: new HttpAgent(),
    https: new HttpsAgent(),
  },
});

export default httpClient;
