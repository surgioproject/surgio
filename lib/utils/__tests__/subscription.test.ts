import test from 'ava';

import { formatSubscriptionUserInfo, parseSubscriptionNode } from '../subscription';

test('parseSubscriptionNode', t => {
  const result = parseSubscriptionNode('剩余流量：57.37% 1.01TB', '过期时间：2020-04-21 22:27:38');
  const reformat = formatSubscriptionUserInfo(result);

  t.is(result.upload, 0);
  t.is(result.download, 825185680652);
  t.is(result.total, 1935692424705);
  t.truthy(reformat.expire.includes('2020-04-21'));
});
