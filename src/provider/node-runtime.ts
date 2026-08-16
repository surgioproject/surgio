import { createLogger } from '@surgio/logger'

import packageJson from '../../package.json' with { type: 'json' }
import { getConfig } from '../config.js'
import { unifiedCache } from '../cache/singleton.js'
import { setDefaultProviderRuntimeContext } from '../runtime/provider-context.js'
import { setDefaultRuntimeLogger } from '../runtime/logger.js'
import { getProviderCacheMaxage } from '../utils/env-flag.js'
import httpClient from '../utils/http-client.js'

const logger = createLogger({ service: 'surgio:Provider' })

setDefaultRuntimeLogger(logger)

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
