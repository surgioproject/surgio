import { getConfig } from '../config.js'

import { createFilesystemStore } from './stores/filesystem.js'
import { createUpstashStore } from './stores/upstash.js'

import type { PreparedKvStore } from './types.js'

export const createConfiguredStore = (): PreparedKvStore => {
  const config = getConfig().cache

  if (
    !config ||
    config.type === undefined ||
    config.type === 'default' ||
    config.type === 'filesystem'
  ) {
    return {
      store: createFilesystemStore({ directory: config?.directory }),
      type: 'filesystem',
    }
  }

  switch (config.type) {
    case 'upstash': {
      const url = config.upstashRestUrl ?? process.env.UPSTASH_REDIS_REST_URL
      const token =
        config.upstashRestToken ?? process.env.UPSTASH_REDIS_REST_TOKEN

      if (!url || !token) {
        throw new Error(
          'Upstash cache requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN',
        )
      }
      return { store: createUpstashStore(url, token), type: 'upstash' }
    }
  }
}
