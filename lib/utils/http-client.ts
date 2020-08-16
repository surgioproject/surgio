import got from 'got';
import HttpAgent, { HttpsAgent } from 'agentkeepalive';

import { NETWORK_TIMEOUT, NETWORK_SURGIO_UA, NETWORK_RETRY } from './constant';

const pkg = require('../../package.json');

export const getUserAgent = (str?: string): string => `${str ? str + ' ' : ''}${NETWORK_SURGIO_UA}/${pkg.version}`;

const httpClient = got.extend({
  timeout: NETWORK_TIMEOUT,
  retry: NETWORK_RETRY,
  headers: {
    'user-agent': getUserAgent(),
  },
  agent: {
    http: new HttpAgent(),
    https: new HttpsAgent()
  },
});

export default httpClient;
