import test from 'ava';
import * as dns from '../../lib/utils/dns';

test('isIp', t => {
  t.true(dns.isIp('0.0.0.0'));
  t.true(dns.isIp('255.255.255.255'));
  t.false(dns.isIp('256.256.256.256'));
  t.false(dns.isIp('example.com'));
});

test('resolveDomain', async t => {
  const ips = await dns.resolveDomain('gstatic.com');
  t.true(dns.isIp(ips[0]));
});
