import { promises as dns, RecordWithTtl } from 'dns';
import LRU from 'lru-cache';
import { createLogger } from '@surgio/logger';
import Bluebird from 'bluebird';

import { isGitHubActions, isGitLabCI, isHeroku, isNow } from './';
import { NETWORK_RESOLVE_TIMEOUT } from './constant';

const Resolver = dns.Resolver;
const resolver = new Resolver();
const DomainCache = new LRU<string, ReadonlyArray<string>>({
  max: 5000,
});
const logger = createLogger({ service: 'surgio:utils:dns' });

// istanbul ignore next
if (isNow() || isHeroku() || isGitHubActions() || isGitLabCI()) {
  resolver.setServers(['1.1.1.1', '8.8.8.8']);
} else {
  resolver.setServers(['223.5.5.5', '114.114.114.114']);
}

export const resolveDomain = async (
  domain: string,
  timeout: number = NETWORK_RESOLVE_TIMEOUT,
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
    `resolved domain ${domain}: ${JSON.stringify(records)} ${Date.now() -
      now}ms`,
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
    resolver.resolve4(domain, { ttl: true }).catch(onErr),
    resolver.resolve6(domain, { ttl: true }).catch(onErr),
  ]);

  return [...ipv4, ...ipv6];
};
