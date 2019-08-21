// tslint:disable:no-expression-statement
import test from 'ava';
import { NodeTypeEnum, ShadowsocksNodeConfig, SimpleNodeConfig } from '../types';
import * as utils from './';

test('getSurgeNodes', async t => {
  const nodeList: ReadonlyArray<ShadowsocksNodeConfig> = [{
    nodeName: 'Test Node 1',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'example.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    obfs: 'tls',
    'obfs-host': 'example.com',
    'udp-relay': 'true',
  }, {
    nodeName: 'Test Node 2',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'example2.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
  }, {
    enable: false,
    nodeName: 'Test Node 3',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'example2.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
  }];
  const txt1 = utils.getSurgeNodes(nodeList);
  const txt2 = utils.getSurgeNodes(nodeList, nodeConfig => nodeConfig.nodeName !== 'Test Node 2');

  t.is(txt1, 'Test Node 1 = custom, example.com, 443, chacha20-ietf-poly1305, password, https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module, udp-relay=true, obfs=tls, obfs-host=example.com\nTest Node 2 = custom, example2.com, 443, chacha20-ietf-poly1305, password, https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module');
  t.is(txt2, 'Test Node 1 = custom, example.com, 443, chacha20-ietf-poly1305, password, https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module, udp-relay=true, obfs=tls, obfs-host=example.com')
});

test('getNodeNames', async t => {
  const nodeNameList: ReadonlyArray<SimpleNodeConfig> = [
    {
      type: NodeTypeEnum.Shadowsocks,
      enable: true,
      nodeName: 'Test Node 1',
    }, {
      type: NodeTypeEnum.Shadowsocks,
      enable: false,
      nodeName: 'Test Node 2',
    }, {
      type: NodeTypeEnum.Snell,
      enable: true,
      nodeName: 'Test Node 3',
    }
  ];
  const txt1 = utils.getNodeNames(nodeNameList, [NodeTypeEnum.Shadowsocks]);
  const txt2 = utils.getNodeNames(nodeNameList, [NodeTypeEnum.Shadowsocks, NodeTypeEnum.Snell]);
  const txt3 = utils.getNodeNames(nodeNameList, [NodeTypeEnum.Shadowsocks, NodeTypeEnum.Snell], simpleNodeConfig => simpleNodeConfig.nodeName !== 'Test Node 3');

  t.is(txt1, 'Test Node 1');
  t.is(txt2, 'Test Node 1, Test Node 3');
  t.is(txt3, 'Test Node 1');
});

test('getClashNodes', async t => {
  const nodeList: ReadonlyArray<ShadowsocksNodeConfig> = [{
    nodeName: 'Test Node 1',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'example.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    obfs: 'tls',
    'obfs-host': 'example.com',
    'udp-relay': 'true',
  }, {
    nodeName: 'Test Node 2',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'example2.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
  }];
  const array1 = utils.getClashNodes(nodeList);

  t.deepEqual(array1[0], {
    name: 'Test Node 1',
    type: 'ss',
    server: 'example.com',
    port: '443',
    cipher: 'chacha20-ietf-poly1305',
    password: 'password',
    udp: true,
    plugin: 'obfs',
    'plugin-opts': {
      mode: 'tls',
      host: 'example.com',
    },
  });
  t.deepEqual(array1[1], {
    name: 'Test Node 2',
    type: 'ss',
    server: 'example2.com',
    port: '443',
    cipher: 'chacha20-ietf-poly1305',
    password: 'password',
    udp: false,
  });
  t.is(array1.length, 2);
});

test('getShadowsocksNodes', async t => {
  const nodeList: ReadonlyArray<ShadowsocksNodeConfig> = [
    {
      nodeName: '🇭🇰HK(Example)',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example.com',
      port: '8443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      obfs: 'tls',
      'obfs-host': 'gateway.icloud.com',
      'udp-relay': 'true',
    },
  ];
  const txt1 = utils.getShadowsocksNodes(nodeList, 'GroupName');

  t.is(txt1, 'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@example.com:8443/?plugin=obfs-local%3Bobfs%3Dtls%3Bobfs-host%3Dgateway.icloud.com&group=GroupName#%F0%9F%87%AD%F0%9F%87%B0HK(Example)');
});

test('getDownloadUrl', t => {
  t.is(utils.getDownloadUrl('https://example.com/', 'test.conf'), 'https://example.com/test.conf');
  t.is(utils.getDownloadUrl(undefined, 'test.conf'), '/test.conf');
});

test('normalizeClashProxyGroupConfig', t => {
  function proxyGroupModifier(_, filters): any {
    return [
      {
        name: '🚀 Proxy',
        type: 'select',
      },
      {
        name: 'US',
        filter: filters.usFilter,
        type: 'url-test',
      },
      {
        name: 'HK',
        filter: filters.hkFilter,
        type: 'url-test',
      },
      {
        name: '🍎 Apple',
        proxies: ['DIRECT', '🚀 Proxy', 'US'],
        type: 'select',
      },
    ];
  }
  const result = [
    {
      name: '🚀 Proxy',
      type: 'select',
      proxies: ['🇭🇰HK(Example)'],
    },
    {
      name: 'US',
      type: 'url-test',
      proxies: [],
      url: 'http://www.gstatic.com/generate_204',
      interval: 1200,
    },
    {
      name: 'HK',
      type: 'url-test',
      proxies: ['🇭🇰HK(Example)'],
      url: 'http://www.gstatic.com/generate_204',
      interval: 1200,
    },
    {
      name: '🍎 Apple',
      proxies: ['DIRECT', '🚀 Proxy', 'US'],
      type: 'select',
    },
  ];

  t.deepEqual(utils.normalizeClashProxyGroupConfig([
    {
      nodeName: '🇭🇰HK(Example)',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example.com',
      port: '8443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
    },
  ], {
    hkFilter: utils.hkFilter,
    usFilter: utils.usFilter,
  }, proxyGroupModifier as any), result);
});
