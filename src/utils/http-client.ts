import pkg from '../../package.json' with { type: 'json' }
import { NETWORK_SURGIO_UA } from '../constant/index.js'
import { createHttpClient } from '../runtime/http-client.js'

import { getNetworkRetry, getNetworkTimeout } from './env-flag.js'

import type { RuntimeHttpClient } from '../runtime/types.js'

export const getUserAgent = (str?: string): string =>
  `${str ? str + ' ' : ''}${NETWORK_SURGIO_UA}/${pkg.version}`

export const createDefaultHttpClient = (
  fetchImplementation?: typeof globalThis.fetch,
): RuntimeHttpClient =>
  createHttpClient({
    fetch: fetchImplementation,
    headers: { 'user-agent': getUserAgent() },
    retry: getNetworkRetry(),
    timeout: getNetworkTimeout(),
  })

export default createDefaultHttpClient()
