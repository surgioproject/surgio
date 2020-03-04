import test from 'ava';
import { NodeTypeEnum, SupportProviderEnum } from '../../types';
import V2rayNSubscribeProvider, { getV2rayNSubscription } from '../V2rayNSubscribeProvider';

test('V2rayNSubscribeProvider', async t => {
  const provider = new V2rayNSubscribeProvider('test', {
    type: SupportProviderEnum.V2rayNSubscribe,
    url: 'http://example.com/test-v2rayn-sub.txt',
  });

  await t.notThrowsAsync(async () => {
    await provider.getNodeList();
  });
});

test('getV2rayNSubscription', async t => {
  const url = 'http://example.com/test-v2rayn-sub.txt';
  const configList = await getV2rayNSubscription(url);

  t.deepEqual(configList[0], {
    alterId: '64',
    host: 'example.com',
    hostname: '1.1.1.1',
    method: 'auto',
    network: 'ws',
    nodeName: '测试 1',
    path: '/',
    port: 8080,
    tls: false,
    type: NodeTypeEnum.Vmess,
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  });
  t.deepEqual(configList[1], {
    alterId: '64',
    host: 'example.com',
    hostname: '1.1.1.1',
    method: 'auto',
    network: 'tcp',
    nodeName: '测试 2',
    path: '/',
    port: 8080,
    tls: false,
    type: NodeTypeEnum.Vmess,
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  });
});
