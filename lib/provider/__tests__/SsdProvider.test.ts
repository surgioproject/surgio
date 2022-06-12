import test from 'ava';
import sinon from 'sinon';

import { SupportProviderEnum } from '../../types';
import * as config from '../../utils/config';
import SsdProvider from '../SsdProvider';

const sandbox = sinon.createSandbox();

test.beforeEach(() => {
  sandbox.restore();
  sandbox.stub(config, 'getConfig').returns({} as any);
});

test('SsdProvider 1', async (t) => {
  const provider = new SsdProvider('test', {
    type: SupportProviderEnum.Ssd,
    url: 'http://example.com/ssd-sample.txt',
  });
  const nodeList = await provider.getNodeList();

  t.snapshot(nodeList);
});

test('SsdProvider 2', async (t) => {
  const provider = new SsdProvider('test', {
    type: SupportProviderEnum.Ssd,
    url: 'http://example.com/ssd-sample-2.txt',
  });
  const nodeList = await provider.getNodeList();

  t.snapshot(nodeList);
});

test('SsdProvider udpRelay', async (t) => {
  const provider = new SsdProvider('test', {
    type: SupportProviderEnum.Ssd,
    url: 'http://example.com/ssd-sample.txt',
    udpRelay: true,
  });
  const nodeList = await provider.getNodeList();

  t.snapshot(nodeList);
});

test('SsdProvider.getSubscriptionUserInfo', async (t) => {
  const provider = new SsdProvider('test', {
    type: SupportProviderEnum.Ssd,
    url: 'http://example.com/ssd-sample.txt',
  });
  const userInfo = await provider.getSubscriptionUserInfo();

  t.is(userInfo!.upload, 0);
  t.is(userInfo!.download, 32212254720);
  t.is(userInfo!.total, 429496729600);
});
