import got from 'got';
import HttpAgent, { HttpsAgent } from 'agentkeepalive';

import { NETWORK_TIMEOUT } from './constant';

const httpClient = got.extend({
  timeout: NETWORK_TIMEOUT,
  agent: {
    http: new HttpAgent(),
    https: new HttpsAgent()
  },
});

export default httpClient;
