import test from 'ava';
import sinon from 'sinon';

import { NodeTypeEnum } from '../../types';
import * as config from '../../utils/config';
import { getShadowsocksrSubscription } from '../ShadowsocksrSubscribeProvider';

const sandbox = sinon.createSandbox();

test.beforeEach(() => {
  sandbox.restore();
  sandbox.stub(config, 'getConfig').returns({} as any);
});

test('getShadowsocksrSubscription', async (t) => {
  const { nodeList } = await getShadowsocksrSubscription(
    'http://example.com/test-ssr-sub.txt?v=1',
    false,
  );
  const { nodeList: nodeList2 } = await getShadowsocksrSubscription(
    'http://example.com/test-ssr-sub.txt?v=2',
    true,
  );

  t.deepEqual(nodeList[0], {
    nodeName: '测试中文',
    type: NodeTypeEnum.Shadowsocksr,
    hostname: '127.0.0.1',
    port: '1234',
    method: 'aes-128-cfb',
    password: 'aaabbb',
    obfs: 'tls1.2_ticket_auth',
    obfsparam: 'breakwa11.moe',
    protocol: 'auth_aes128_md5',
    protoparam: '',
    udpRelay: false,
  });
  t.deepEqual(nodeList2[0], {
    nodeName: '测试中文',
    type: NodeTypeEnum.Shadowsocksr,
    hostname: '127.0.0.1',
    port: '1234',
    method: 'aes-128-cfb',
    password: 'aaabbb',
    obfs: 'tls1.2_ticket_auth',
    obfsparam: 'breakwa11.moe',
    protocol: 'auth_aes128_md5',
    protoparam: '',
    udpRelay: true,
  });
});
