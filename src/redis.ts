import { createLogger } from '@surgio/logger'
import Redis from 'ioredis'

import { CACHE_KEYS } from './constant'

const logger = createLogger({ service: 'surgio:redis' })

const prepareRedis = () => {
  let client: Redis | null = null
  let redisURL: string | null = null

  return {
    hasRedis: () => !!client,
    createRedis(_redisURL: string, customRedis?: any): Redis {
      if (client && redisURL) {
        logger.debug('Redis client already created with URL: %s', redisURL)
        return client
      }
      redisURL = _redisURL

      if (customRedis) {
        client = new customRedis(_redisURL)
      } else {
        client = new Redis(_redisURL)
      }

      return client as Redis
    },
    getRedis(): Redis {
      if (!client) {
        throw new Error('Redis client is not initialized')
      }
      return client
    },
    async destroyRedis(): Promise<void> {
      if (client) {
        await client.quit()
        client = null
        redisURL = null
      }
    },
    async cleanCache(): Promise<void> {
      if (!client) {
        return
      }

      const keysToRemove = await Promise.all(
        Object.keys(CACHE_KEYS).map((key) => {
          if (!client) return

          return client.keys(`${CACHE_KEYS[key]}:*`)
        }),
      )

      await Promise.all(
        keysToRemove.map((keys) => {
          if (!client || !keys || !keys.length) return
          return client.del(keys)
        }),
      )
    },
  }
}
const redis = prepareRedis()

export default redis
