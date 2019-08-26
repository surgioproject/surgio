// tslint:disable:no-expression-statement
import test from 'ava';
import { NodeTypeEnum, ShadowsocksNodeConfig, SimpleNodeConfig, VmessNodeConfig } from '../types';
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
  const nodeList: ReadonlyArray<ShadowsocksNodeConfig|VmessNodeConfig> = [{
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
    alterId: '64',
    host: 'example.com',
    hostname: '1.1.1.1',
    method: 'auto',
    network: 'ws',
    nodeName: 'Test Node 3',
    path: '/',
    port: 8080,
    tls: false,
    type: NodeTypeEnum.Vmess,
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  }, {
    alterId: '64',
    host: '',
    hostname: '1.1.1.1',
    method: 'auto',
    network: 'tcp',
    nodeName: 'Test Node 4',
    path: '/',
    port: 8080,
    tls: false,
    type: NodeTypeEnum.Vmess,
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  }];
  const array = utils.getClashNodes(nodeList);

  t.deepEqual(array[0], {
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
  t.deepEqual(array[1], {
    name: 'Test Node 2',
    type: 'ss',
    server: 'example2.com',
    port: '443',
    cipher: 'chacha20-ietf-poly1305',
    password: 'password',
    udp: false,
  });
  t.deepEqual(array[2], {
    cipher: 'auto',
    name: 'Test Node 3',
    alterId: '64',
    server: '1.1.1.1',
    network: 'ws',
    port: 8080,
    tls: false,
    type: 'vmess',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    'ws-path': '/',
    'ws-headers': {
      Host: 'example.com',
    },
  });
  t.deepEqual(array[3], {
    cipher: 'auto',
    name: 'Test Node 4',
    alterId: '64',
    server: '1.1.1.1',
    network: 'tcp',
    port: 8080,
    tls: false,
    type: 'vmess',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  });
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

test('getShadowsocksJSONConfig', async t => {
  const url = 'https://gist.githubusercontent.com/geekdada/c583aa32ee4f93511dff66802b142d10/raw/b76452da7fd587fe3d734520ce373f0c9bb54e87/gui-config.json';
  const config = await utils.getShadowsocksJSONConfig({ url, udpRelay: true });

  t.deepEqual(config[0], {
    nodeName: '🇺🇸US 1',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    'udp-relay': 'true',
    obfs: 'tls',
    'obfs-host': 'gateway-carry.icloud.com',
  });
  t.deepEqual(config[1], {
    nodeName: '🇺🇸US 2',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 444,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    'udp-relay': 'true',
  });
  t.deepEqual(config[2], {
    nodeName: '🇺🇸US 3',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 445,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    'udp-relay': 'true',
    obfs: 'tls',
    'obfs-host': 'www.bing.com',
  });
  t.deepEqual(config[3], {
    nodeName: '🇺🇸US 4',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 80,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    'udp-relay': 'true',
    obfs: 'http',
    'obfs-host': 'www.bing.com',
  });
});

test('loadRemoteSnippetList', async t => {
  const remoteSnippetList = await utils.loadRemoteSnippetList([
    {
      url: 'https://github.com/Blankwonder/surge-list/raw/master/telegram.list',
      name: 'telegram',
    },
    {
      url: 'https://github.com/Blankwonder/surge-list/raw/master/netflix.list',
      name: 'netflix',
    },
    {
      url: 'https://gist.githubusercontent.com/geekdada/77995d58363c0a271ab56bbcc2dc9054/raw/d1ba422e96a29d8a846303454aeba8fa0ee72e1c/test-ruleset.list',
      name: 'test',
    }
  ]);
  const result1 = 'IP-CIDR,91.108.56.0/22,Proxy,no-resolve\n' +
    'IP-CIDR,91.108.4.0/22,Proxy,no-resolve\n' +
    'IP-CIDR,91.108.8.0/22,Proxy,no-resolve\n' +
    'IP-CIDR,109.239.140.0/24,Proxy,no-resolve\n' +
    'IP-CIDR,149.154.160.0/20,Proxy,no-resolve\n' +
    'IP-CIDR,149.154.164.0/22,Proxy,no-resolve\n' +
    'IP-CIDR,149.154.172.0/22,Proxy,no-resolve\n' +
    'IP-CIDR,91.108.12.0/22,Proxy,no-resolve';
  const result2 = '# Netflix\n' +
    'USER-AGENT,Argo*,Proxy\n' +
    'DOMAIN-SUFFIX,fast.com,Proxy\n' +
    'DOMAIN-SUFFIX,netflix.com,Proxy\n' +
    'DOMAIN-SUFFIX,netflix.net,Proxy\n' +
    'DOMAIN-SUFFIX,nflxext.com,Proxy\n' +
    'DOMAIN-SUFFIX,nflximg.com,Proxy\n' +
    'DOMAIN-SUFFIX,nflximg.net,Proxy\n' +
    'DOMAIN-SUFFIX,nflxso.net,Proxy\n' +
    'DOMAIN-SUFFIX,nflxvideo.net,Proxy';
  const result3 = '# China Apps\n' +
    'USER-AGENT,MicroMessenger Client,Proxy\n' +
    'USER-AGENT,WeChat*,Proxy\n' +
    'USER-AGENT,MApi*,Proxy // Dianping\n' +
    'IP-CIDR,149.154.164.0/22,Proxy,no-resolve // Telegram';

  t.is(remoteSnippetList[0].main('Proxy'), result1);
  t.is(remoteSnippetList[1].main('Proxy'), result2);
  t.is(remoteSnippetList[2].main('Proxy'), result3);
});

test('getV2rayNSubscription', async t => {
  const url = 'https://gist.githubusercontent.com/geekdada/6a427f0a39165ceb00f5e80e6a31b71b/raw/2b09d5d4e75784e1bfe4a4d07ffc8def2febd076/test-v2rayn-sub.txt';
  const configList = await utils.getV2rayNSubscription({ url });

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

test('getV2rayNNodes', t => {
  const schemeList = utils.getV2rayNNodes([
    {
      type: NodeTypeEnum.Vmess,
      alterId: '64',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: '测试 1',
      path: '/',
      port: 8080,
      tls: false,
      host: 'example.com',
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    },
    {
      type: NodeTypeEnum.Vmess,
      alterId: '64',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'tcp',
      nodeName: '测试 2',
      path: '/',
      port: 8080,
      tls: false,
      host: '',
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    },
    {
      type: NodeTypeEnum.Vmess,
      alterId: '64',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: '测试 3',
      path: '/',
      port: 8080,
      tls: false,
      host: '',
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    },
  ])
    .split('\n');

  t.is(schemeList[0], 'vmess://eyJ2IjoiMiIsInBzIjoi5rWL6K+VIDEiLCJhZGQiOiIxLjEuMS4xIiwicG9ydCI6IjgwODAiLCJpZCI6IjEzODZmODVlLTY1N2ItNGQ2ZS05ZDU2LTc4YmFkYjc1ZTFmZCIsImFpZCI6IjY0IiwibmV0Ijoid3MiLCJ0eXBlIjoibm9uZSIsImhvc3QiOiJleGFtcGxlLmNvbSIsInBhdGgiOiIvIiwidGxzIjoiIn0=');
  t.is(schemeList[1], 'vmess://eyJ2IjoiMiIsInBzIjoi5rWL6K+VIDIiLCJhZGQiOiIxLjEuMS4xIiwicG9ydCI6IjgwODAiLCJpZCI6IjEzODZmODVlLTY1N2ItNGQ2ZS05ZDU2LTc4YmFkYjc1ZTFmZCIsImFpZCI6IjY0IiwibmV0IjoidGNwIiwidHlwZSI6Im5vbmUiLCJob3N0IjoiIiwicGF0aCI6Ii8iLCJ0bHMiOiIifQ==');
  t.is(schemeList[2], 'vmess://eyJ2IjoiMiIsInBzIjoi5rWL6K+VIDMiLCJhZGQiOiIxLjEuMS4xIiwicG9ydCI6IjgwODAiLCJpZCI6IjEzODZmODVlLTY1N2ItNGQ2ZS05ZDU2LTc4YmFkYjc1ZTFmZCIsImFpZCI6IjY0IiwibmV0Ijoid3MiLCJ0eXBlIjoibm9uZSIsImhvc3QiOiIiLCJwYXRoIjoiLyIsInRscyI6IiJ9');
});
