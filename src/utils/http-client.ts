import got from 'got'
import http from 'http'
import https from 'https'
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
          : new http.Agent({ keepAlive: true }),
        https: httpsProxy
          ? new HttpsProxyAgent({
              keepAlive: true,
              keepAliveMsecs: 1000,
              maxSockets: 256,
              maxFreeSockets: 256,
              scheduling: 'lifo',
              proxy: httpsProxy,
            })
          : new https.Agent({ keepAlive: true }),
      }
    : {
        http: new http.Agent({ keepAlive: true }),
        https: new https.Agent({ keepAlive: true }),
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
