import test from 'ava';
import { SupportProviderEnum } from '../../types';
import V2rayNSubscribeProvider, {
  getV2rayNSubscription,
} from '../V2rayNSubscribeProvider';

test('V2rayNSubscribeProvider', async (t) => {
  const provider = new V2rayNSubscribeProvider('test', {
    type: SupportProviderEnum.V2rayNSubscribe,
    url: 'http://example.com/test-v2rayn-sub.txt',
  });

  await t.notThrowsAsync(async () => {
    await provider.getNodeList();
  });
});

test('getV2rayNSubscription', async (t) => {
  const url = 'http://example.com/test-v2rayn-sub.txt';
  const configList = await getV2rayNSubscription(url, false);

  t.snapshot(configList);
});

test('getV2rayNSubscription compatible mode', async (t) => {
  const url = 'http://example.com/test-v2rayn-sub-compatible.txt';
  const configList = await getV2rayNSubscription(url, true);

  t.snapshot(configList);
});

test('getV2rayNSubscription udpRelay skipCertVerify', async (t) => {
  const url = 'http://example.com/test-v2rayn-sub-compatible.txt';
  const configList = await getV2rayNSubscription(url, true, true, true);

  t.snapshot(configList);
});
