import { createConfiguredStore } from './configured-store.js'
import { TtlCache } from './ttl-cache.js'

export const unifiedCache = new TtlCache({ createStore: createConfiguredStore })

/* istanbul ignore next -- @preserve */
export const cleanCaches = async (): Promise<void> => {
  await unifiedCache.reset()
}
