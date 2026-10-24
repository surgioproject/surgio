import { createLogger } from '@surgio/logger'

import packageJson from '../../package.json' with { type: 'json' }
import { getConfig } from '../config.js'
import { unifiedCache } from '../cache/singleton.js'
import { setDefaultProviderRuntimeContext } from '../runtime/provider-context.js'
import { httpClient } from '../runtime/http-client.js'
import { getProviderCacheMaxage } from '../utils/env-flag.js'

const logger = createLogger({ service: 'surgio:Provider' })

setDefaultProviderRuntimeContext({
  cache: unifiedCache,
  get config() {
    try {
      return { gateway: getConfig().gateway }
    } catch {
      return { gateway: undefined }
    }
  },
  httpClient,
  logger,
  get providerCacheTtl() {
    return getProviderCacheMaxage()
  },
  version: packageJson.version,
})
