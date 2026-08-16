import { promises as dns, RecordWithTtl } from 'dns'
import { createLogger } from '@surgio/logger'
import Bluebird from 'bluebird'

import { coalesceAsync } from '../runtime/dns.js'

import { getNetworkResolveTimeout } from './env-flag.js'

const logger = createLogger({ service: 'surgio:utils:dns' })

export const resolveDomain = async (
  domain: string,
  timeout: number = getNetworkResolveTimeout(),
): Promise<ReadonlyArray<string>> => {
  logger.debug(`try to resolve domain ${domain}`)
  const now = Date.now()
  const records = await Bluebird.race<ReadonlyArray<RecordWithTtl>>([
    resolve4And6Once(domain),
    Bluebird.delay(timeout).then(() => []),
  ])
  logger.debug(
    `resolved domain ${domain}: ${JSON.stringify(records)} ${
      Date.now() - now
    }ms`,
  )

  if (records.length) {
    return records.map((item) => item.address)
  }

  /* istanbul ignore next -- @preserve */
  return []
}

export const resolve4And6 = async (
  domain: string,
): Promise<ReadonlyArray<RecordWithTtl>> => {
  /* istanbul ignore next -- @preserve */
  function onErr(): ReadonlyArray<never> {
    return []
  }

  const [ipv4, ipv6] = await Promise.all([
    dns.resolve4(domain, { ttl: true }).catch(onErr),
    dns.resolve6(domain, { ttl: true }).catch(onErr),
  ])

  return [...ipv4, ...ipv6]
}

const resolve4And6Once = coalesceAsync(resolve4And6)
