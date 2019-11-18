import { promises as dns } from 'dns';
import Debug from 'debug';
import LRU from 'lru-cache';

const debug = Debug('surgio:utils:dns');
const Resolver = dns.Resolver;
const resolver = new Resolver();
const DomainCache = new LRU<string, ReadonlyArray<string>>({
  max: 1000,
});

resolver.setServers(['223.5.5.5', '114.114.114.114', '8.8.8.8', '1.1.1.1']);

export const resolveDomain = async (domain: string): Promise<ReadonlyArray<string>> => {
  if (DomainCache.has(domain)) {
    return DomainCache.get(domain);
  }

  debug(`try to resolve domain ${domain}`);
  const records = await resolver.resolve4(domain, { ttl: true });
  debug(`resolved domain ${domain}: ${JSON.stringify(records)}`);

  const address = records.map(item => item.address);

  DomainCache.set(domain, address, records[0].ttl * 1000);

  return address;
};

export const isIp = (str: string): boolean => /^(?:(?:^|\.)(?:2(?:5[0-5]|[0-4]\d)|1?\d?\d)){4}$/gm.test(str);
