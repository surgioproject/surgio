import got from 'got'
import HttpAgent, { HttpsAgent } from 'agentkeepalive'
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent'

import { NETWORK_SURGIO_UA } from '../constant'

import { getNetworkRetry, getNetworkTimeout } from './env-flag'

const httpProxy = hasHTTPProxy()
const httpsProxy = hasHTTPSProxy()
const pkg = require('../../package.json')
const agent =
  !!httpProxy || !!httpsProxy
    ? {
        http: httpProxy
          ? new HttpProxyAgent({
              keepAlive: true,
              keepAliveMsecs: 1000,
              maxSockets: 256,
              maxFreeSockets: 256,
              scheduling: 'lifo',
              proxy: httpProxy,
            })
          : new HttpAgent(),
        https: httpsProxy
          ? new HttpsProxyAgent({
              keepAlive: true,
              keepAliveMsecs: 1000,
              maxSockets: 256,
              maxFreeSockets: 256,
              scheduling: 'lifo',
              proxy: httpsProxy,
            })
          : new HttpsAgent(),
      }
    : {
        http: new HttpAgent(),
        https: new HttpsAgent(),
      }

export const getUserAgent = (str?: string): string =>
  `${str ? str + ' ' : ''}${NETWORK_SURGIO_UA}/${pkg.version}`

const httpClient = got.extend({
  timeout: getNetworkTimeout(),
  retry: getNetworkRetry(),
  headers: {
    'user-agent': getUserAgent(),
  },
  agent,
})

function hasHTTPProxy(): string | undefined {
  return process.env.HTTP_PROXY || process.env.http_proxy
}

function hasHTTPSProxy(): string | undefined {
  return process.env.HTTPS_PROXY || process.env.https_proxy
}

export default httpClient
