import test from 'ava';
import nock from 'nock';

import { SupportProviderEnum } from '../../types';
import SsdProvider from '../SsdProvider';

test('SsdProvider', async t => {
  const provider = new SsdProvider('test', {
    type: SupportProviderEnum.Ssd,
    url: 'http://example.com/ssd-sample.txt',
  });
  const nodeList = await provider.getNodeList();

  t.snapshot(nodeList);
});

test('SsdProvider udpRelay', async t => {
  const provider = new SsdProvider('test', {
    type: SupportProviderEnum.Ssd,
    url: 'http://example.com/ssd-sample.txt',
    udpRelay: true,
  });
  const nodeList = await provider.getNodeList();

  t.snapshot(nodeList);
});

test('SsdProvider.getSubscriptionUserInfo', async t => {
  const provider = new SsdProvider('test', {
    type: SupportProviderEnum.Ssd,
    url: 'http://example.com/ssd-sample.txt',
  });
  const userInfo = await provider.getSubscriptionUserInfo();

  t.deepEqual(userInfo, {
    upload: 0,
    download: 32212254720,
    total: 429496729600,
    expire: 4094954887,
  });
});
