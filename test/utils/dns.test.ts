import test from 'ava';
import { isGitHubActions, isIp } from '../../lib/utils';
import * as dns from '../../lib/utils/dns';

test('resolveDomain ipv4', async (t) => {
  const ips = await dns.resolveDomain('gstatic.com');
  t.true(isIp(ips[0]));
});

test('resolveDomain ipv6', async (t) => {
  const ips = await dns.resolveDomain('ipv6.lookup.test-ipv6.com');
  t.true(isIp(ips[0]));
});

if (!isGitHubActions()) {
  test('resolveDomain timeout', async (t) => {
    const ips = await dns.resolveDomain('www.gstatic.com', 0);
    t.is(ips.length, 0);
  });
}
