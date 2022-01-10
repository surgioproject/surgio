import { promises as dns, RecordWithTtl } from 'dns';
import LRU from 'lru-cache';
import { createLogger } from '@surgio/logger';
import Bluebird from 'bluebird';

import { getNetworkResolveTimeout } from './env-flag';

const DomainCache = new LRU<string, ReadonlyArray<string>>({
  max: 5000,
});
const logger = createLogger({ service: 'surgio:utils:dns' });

export const resolveDomain = async (
  domain: string,
  timeout: number = getNetworkResolveTimeout(),
): Promise<ReadonlyArray<string>> => {
  if (DomainCache.has(domain)) {
    return DomainCache.get(domain) as ReadonlyArray<string>;
  }

  logger.debug(`try to resolve domain ${domain}`);
  const now = Date.now();
  const records = await Bluebird.race<ReadonlyArray<RecordWithTtl>>([
    resolve4And6(domain),
    Bluebird.delay(timeout).then(() => []),
  ]);
  logger.debug(
    `resolved domain ${domain}: ${JSON.stringify(records)} ${
      Date.now() - now
    }ms`,
  );

  if (records.length) {
    const address = records.map((item) => item.address);
    DomainCache.set(domain, address, records[0].ttl * 1000);
    return address;
  }

  // istanbul ignore next
  return [];
};

export const resolve4And6 = async (
  domain: string,
): Promise<ReadonlyArray<RecordWithTtl>> => {
  // istanbul ignore next
  function onErr(): ReadonlyArray<never> {
    return [];
  }

  const [ipv4, ipv6] = await Promise.all([
    dns.resolve4(domain, { ttl: true }).catch(onErr),
    dns.resolve6(domain, { ttl: true }).catch(onErr),
  ]);

  return [...ipv4, ...ipv6];
};
