import { promises as dns } from 'dns';
import LRU from 'lru-cache';
import { createLogger } from '@surgio/logger';
import { isHeroku, isNow } from './';

const Resolver = dns.Resolver;
const resolver = new Resolver();
const DomainCache = new LRU<string, ReadonlyArray<string>>({
  max: 1000,
});
const logger = createLogger({ service: 'surgio:utils:dns' });

// istanbul ignore next
if (isNow() || isHeroku()) {
  resolver.setServers(['1.1.1.1', '8.8.8.8']);
} else {
  resolver.setServers(['223.5.5.5', '114.114.114.114']);
}

export const resolveDomain = async (domain: string): Promise<ReadonlyArray<string>> => {
  if (DomainCache.has(domain)) {
    return DomainCache.get(domain) as ReadonlyArray<string>;
  }

  logger.debug(`try to resolve domain ${domain}`);
  const records = await resolver.resolve4(domain, { ttl: true });
  logger.debug(`resolved domain ${domain}: ${JSON.stringify(records)}`);

  const address = records.map(item => item.address);

  DomainCache.set(domain, address, records[0].ttl * 1000);

  return address;
};
