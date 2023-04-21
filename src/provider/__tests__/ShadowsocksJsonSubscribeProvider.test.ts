import test from 'ava';
import sinon from 'sinon';

import { NodeTypeEnum } from '../../types';
import * as config from '../../config';
import { getShadowsocksJSONConfig } from '../ShadowsocksJsonSubscribeProvider';

const sandbox = sinon.createSandbox();

test.beforeEach(() => {
  sandbox.restore();
  sandbox.stub(config, 'getConfig').returns({} as any);
});

test('getShadowsocksJSONConfig', async (t) => {
  const config = await getShadowsocksJSONConfig(
    'http://example.com/gui-config.json?v=1',
    true,
  );
  const config2 = await getShadowsocksJSONConfig(
    'http://example.com/gui-config.json?v=2',
    false,
  );

  t.deepEqual(config[0], {
    nodeName: '🇺🇸US 1',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
    obfs: 'tls',
    obfsHost: 'gateway-carry.icloud.com',
  });
  t.deepEqual(config[1], {
    nodeName: '🇺🇸US 2',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 444,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
  });
  t.deepEqual(config[2], {
    nodeName: '🇺🇸US 3',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 445,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
    obfs: 'tls',
    obfsHost: 'www.bing.com',
  });
  t.deepEqual(config[3], {
    nodeName: '🇺🇸US 4',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 80,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
    obfs: 'http',
    obfsHost: 'www.bing.com',
  });
  t.deepEqual(config2[0], {
    nodeName: '🇺🇸US 1',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: false,
    obfs: 'tls',
    obfsHost: 'gateway-carry.icloud.com',
  });
});
