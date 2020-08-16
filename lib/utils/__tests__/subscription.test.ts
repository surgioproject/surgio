import test from 'ava';

import { formatSubscriptionUserInfo, parseSubscriptionNode, parseSubscriptionUserInfo } from '../subscription';

test('parseSubscriptionNode', t => {
  const result = parseSubscriptionNode('剩余流量：57.37% 1.01TB', '过期时间：2020-04-21 22:27:38');
  if (!result) throw new Error();
  const reformat = formatSubscriptionUserInfo(result);

  t.is(result.upload, 0);
  t.is(result.download, 825185680652);
  t.is(result.total, 1935692424705);
  t.truthy(reformat.expire.includes('2020-04-21'));
});

test('formatSubscriptionUserInfo', t => {
  t.deepEqual(
    parseSubscriptionUserInfo('upload=0; download=42211676245; total=216256217222; expire=1584563470;'),
    {
      upload: 0,
      download: 42211676245,
      total: 216256217222,
      expire: 1584563470,
    });

  t.deepEqual(
    parseSubscriptionUserInfo('upload=0; download=42211676245; total=216256217222; expire=1584563470'),
    {
      upload: 0,
      download: 42211676245,
      total: 216256217222,
      expire: 1584563470,
    });
});
