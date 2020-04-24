import test from 'ava';
import { isIp } from '../../lib/utils';
import * as dns from '../../lib/utils/dns';

test('resolveDomain', async t => {
  const ips = await dns.resolveDomain('gstatic.com');
  t.true(isIp(ips[0]));
});
