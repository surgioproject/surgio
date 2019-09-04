// tslint:disable:no-expression-statement
import test from 'ava';
import moxios from 'moxios';
import fs from 'fs';
import path from 'path';

import {
  NodeTypeEnum,
  ShadowsocksNodeConfig,
  ShadowsocksrNodeConfig,
  SimpleNodeConfig,
  VmessNodeConfig,
} from '../lib/types';
import * as utils from '../lib/utils';

test.beforeEach(() => {
  moxios.install();
});

test.afterEach(() => {
  moxios.uninstall();
});

test('getSurgeNodes', async t => {
  const nodeList: ReadonlyArray<ShadowsocksNodeConfig|ShadowsocksrNodeConfig|VmessNodeConfig> = [{
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
  }, {
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
    binPath: '/usr/local/bin/ssr-local',
  }, {
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
    binPath: '/usr/local/bin/v2ray',
  },];
  const txt1 = utils.getSurgeNodes(nodeList).split('\n');
  const txt2 = utils.getSurgeNodes(nodeList, nodeConfig => nodeConfig.nodeName === 'Test Node 1');

  t.is(txt1[0], 'Test Node 1 = custom, example.com, 443, chacha20-ietf-poly1305, password, https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module, udp-relay=true, obfs=tls, obfs-host=example.com');
  t.is(txt1[1], 'Test Node 2 = custom, example2.com, 443, chacha20-ietf-poly1305, password, https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module');
  t.is(txt1[2], '测试中文 = external, exec = "/usr/local/bin/ssr-local", args = "-s", args = "127.0.0.1", args = "-p", args = "1234", args = "-m", args = "aes-128-cfb", args = "-o", args = "tls1.2_ticket_auth", args = "-O", args = "auth_aes128_md5", args = "-k", args = "aaabbb", args = "-l", args = "61100", args = "-b", args = "127.0.0.1", args = "-g", args = "breakwa11.moe", local-port = 61100, addresses = 127.0.0.1');
  t.is(txt1[3], '测试 3 = external, exec = "/usr/local/bin/v2ray", args = "--config", args = "$HOME/.config/surgio/v2ray_1.1.1.1_8080.json", local-port = 61101, addresses = 1.1.1.1');
  t.is(txt2, 'Test Node 1 = custom, example.com, 443, chacha20-ietf-poly1305, password, https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module, udp-relay=true, obfs=tls, obfs-host=example.com');
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
  moxios.stubRequest('/gui-config.json', {
    status: 200,
    responseText: fs.readFileSync(path.join(__dirname, 'asset/gui-config-1.json'), {
      encoding: 'utf8',
    }),
  });

  const config = await utils.getShadowsocksJSONConfig({ url: '/gui-config.json', udpRelay: true });

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
  moxios.stubRequest('/test-ruleset.list', {
    status: 200,
    responseText: fs.readFileSync(path.join(__dirname, 'asset/test-ruleset-1.list'), {
      encoding: 'utf8',
    }),
  });
  moxios.stubRequest('/netflix.list', {
    status: 200,
    responseText: fs.readFileSync(path.join(__dirname, 'asset/netflix.list'), {
      encoding: 'utf8',
    }),
  });
  moxios.stubRequest('/telegram.list', {
    status: 200,
    responseText: fs.readFileSync(path.join(__dirname, 'asset/telegram.list'), {
      encoding: 'utf8',
    }),
  });

  const remoteSnippetList = await utils.loadRemoteSnippetList([
    {
      url: '/telegram.list',
      name: 'telegram',
    },
    {
      url: '/netflix.list',
      name: 'netflix',
    },
    {
      url: '/test-ruleset.list',
      name: 'test',
    },
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

test('loadRemoteSnippetList with error', async t => {
  t.plan(1);

  moxios.stubRequest('/error', {
    status: 500,
    responseText: '',
  });

  try {
    const res = await utils.loadRemoteSnippetList([
      {
        url: '/error',
        name: 'error',
      },
    ]);
  } catch (err) {
    t.truthy(err instanceof Error);
  }
})

test('getV2rayNSubscription', async t => {
  moxios.stubRequest('/test-v2rayn-sub.txt', {
    status: 200,
    responseText: fs.readFileSync(path.join(__dirname, 'asset/test-v2rayn-sub.txt'), {
      encoding: 'utf8',
    }),
  });

  const url = '/test-v2rayn-sub.txt';
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
      tls: true,
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
  t.is(schemeList[1], 'vmess://eyJ2IjoiMiIsInBzIjoi5rWL6K+VIDIiLCJhZGQiOiIxLjEuMS4xIiwicG9ydCI6IjgwODAiLCJpZCI6IjEzODZmODVlLTY1N2ItNGQ2ZS05ZDU2LTc4YmFkYjc1ZTFmZCIsImFpZCI6IjY0IiwibmV0IjoidGNwIiwidHlwZSI6Im5vbmUiLCJob3N0IjoiIiwicGF0aCI6Ii8iLCJ0bHMiOiJ0bHMifQ==');
  t.is(schemeList[2], 'vmess://eyJ2IjoiMiIsInBzIjoi5rWL6K+VIDMiLCJhZGQiOiIxLjEuMS4xIiwicG9ydCI6IjgwODAiLCJpZCI6IjEzODZmODVlLTY1N2ItNGQ2ZS05ZDU2LTc4YmFkYjc1ZTFmZCIsImFpZCI6IjY0IiwibmV0Ijoid3MiLCJ0eXBlIjoibm9uZSIsImhvc3QiOiIiLCJwYXRoIjoiLyIsInRscyI6IiJ9');
});

test('getQuantumultNodes', t => {
  const schemeList = utils.getQuantumultNodes([
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
    {
      type: NodeTypeEnum.Shadowsocksr,
      nodeName: '🇭🇰HK',
      hostname: 'hk.example.com',
      port: 10000,
      method: 'chacha20-ietf',
      password: 'password',
      obfs: 'tls1.2_ticket_auth',
      obfsparam: 'music.163.com',
      protocol: 'auth_aes128_md5',
      protoparam: '',
    },
    {
      type: NodeTypeEnum.HTTPS,
      nodeName: 'test',
      hostname: 'a.com',
      port: 443,
      username: 'snsms',
      password: 'nndndnd',
    },
    {
      nodeName: '🇺🇸US 1',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'us.example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      'udp-relay': 'true',
      obfs: 'tls',
      'obfs-host': 'gateway-carry.icloud.com',
    },
  ])
    .split('\n');

  t.is(schemeList[0],  'vmess://5rWL6K+VIDEgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXdzLG9iZnMtcGF0aD0iLyIsb2Jmcy1oZWFkZXI9Ikhvc3Q6ZXhhbXBsZS5jb21bUnJdW05uXVVzZXItQWdlbnQ6TW96aWxsYS81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxMl8zXzEgbGlrZSBNYWMgT1MgWCkgQXBwbGVXZWJLaXQvNjA1LjEuMTUgKEtIVE1MLCBsaWtlIEdlY2tvKSBNb2JpbGUvMTVFMTQ4Ig==');
  t.is(schemeList[1], 'vmess://5rWL6K+VIDIgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXRjcCxvYmZzLXBhdGg9Ii8iLG9iZnMtaGVhZGVyPSJIb3N0OjEuMS4xLjFbUnJdW05uXVVzZXItQWdlbnQ6TW96aWxsYS81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxMl8zXzEgbGlrZSBNYWMgT1MgWCkgQXBwbGVXZWJLaXQvNjA1LjEuMTUgKEtIVE1MLCBsaWtlIEdlY2tvKSBNb2JpbGUvMTVFMTQ4Ig==');
  t.is(schemeList[2], 'vmess://5rWL6K+VIDMgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXdzLG9iZnMtcGF0aD0iLyIsb2Jmcy1oZWFkZXI9Ikhvc3Q6MS4xLjEuMVtScl1bTm5dVXNlci1BZ2VudDpNb3ppbGxhLzUuMCAoaVBob25lOyBDUFUgaVBob25lIE9TIDEyXzNfMSBsaWtlIE1hYyBPUyBYKSBBcHBsZVdlYktpdC82MDUuMS4xNSAoS0hUTUwsIGxpa2UgR2Vja28pIE1vYmlsZS8xNUUxNDgi');
  t.is(schemeList[3], 'ssr://aGsuZXhhbXBsZS5jb206MTAwMDA6YXV0aF9hZXMxMjhfbWQ1OmNoYWNoYTIwLWlldGY6dGxzMS4yX3RpY2tldF9hdXRoOmNHRnpjM2R2Y21RLz9ncm91cD1VM1Z5WjJsdiZvYmZzcGFyYW09YlhWemFXTXVNVFl6TG1OdmJRJnByb3RvcGFyYW09JnJlbWFya3M9OEotSHJmQ2ZoN0JJU3cmdWRwcG9ydD0wJnVvdD0w');
  t.is(schemeList[4], 'http://dGVzdCA9IGh0dHAsIHVwc3RyZWFtLXByb3h5LWFkZHJlc3M9YS5jb20sIHVwc3RyZWFtLXByb3h5LXBvcnQ9NDQzLCB1cHN0cmVhbS1wcm94eS1hdXRoPXRydWUsIHVwc3RyZWFtLXByb3h5LXVzZXJuYW1lPXNuc21zLCB1cHN0cmVhbS1wcm94eS1wYXNzd29yZD1ubmRuZG5kLCBvdmVyLXRscz10cnVlLCBjZXJ0aWZpY2F0ZT0x');
  t.is(schemeList[5], 'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@us.example.com:443/?plugin=obfs-local%3Bobfs%3Dtls%3Bobfs-host%3Dgateway-carry.icloud.com&group=Surgio#%F0%9F%87%BA%F0%9F%87%B8US%201');
});

test('formatV2rayConfig', t => {
  const json = utils.formatV2rayConfig(100, {
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
  });

  t.deepEqual(json, {
    log: {
      loglevel: 'warning'
    },
    inbound: {
      port: 100,
      listen: '127.0.0.1',
      protocol: 'socks',
      settings: {
        auth: 'noauth',
      }
    },
    outbound: {
      protocol: 'vmess',
      settings: {
        vnext: [
          {
            address: '1.1.1.1',
            port: 8080,
            users: [
              {
                id: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
                alterId: 64,
                security: 'auto',
                level: 0,
              }
            ]
          }
        ]
      },
      streamSettings: {
        network: 'ws',
        security: 'none',
        wsSettings: {
          headers: {
            Host: '',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
          },
          path: '/',
        },
      },
    }
  });
});

test('getShadowsocksSubscription with udp', async t => {
  moxios.stubRequest(/\/ss-sub\.txt.*/, {
    status: 200,
    responseText: fs.readFileSync(path.join(__dirname, 'asset/test-ss-sub.txt'), {
      encoding: 'utf8',
    }),
  });

  const nodeList = await utils.getShadowsocksSubscription({
    url: '/ss-sub.txt',
    udpRelay: true,
  });

  t.deepEqual(nodeList[0], {
    type: NodeTypeEnum.Shadowsocks,
    nodeName: '🇺🇸US 1',
    hostname: 'us.example.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    'udp-relay': 'true',
    obfs: 'tls',
    'obfs-host': 'gateway-carry.icloud.com',
  });
  t.deepEqual(nodeList[1], {
    nodeName: '🇺🇸US 2',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    'udp-relay': 'true',
  });
});

test('getShadowsocksSubscription without udp', async t => {
  moxios.stubRequest(/\/ss-sub\.txt.*/, {
    status: 200,
    responseText: fs.readFileSync(path.join(__dirname, 'asset/test-ss-sub.txt'), {
      encoding: 'utf8',
    }),
  });

  const nodeList = await utils.getShadowsocksSubscription({
    url: '/ss-sub.txt',
  });

  t.deepEqual(nodeList[0], {
    type: NodeTypeEnum.Shadowsocks,
    nodeName: '🇺🇸US 1',
    hostname: 'us.example.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    obfs: 'tls',
    'obfs-host': 'gateway-carry.icloud.com',
  });
  t.deepEqual(nodeList[1], {
    nodeName: '🇺🇸US 2',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
  });
});

test('getShadowsocksrSubscription', async t => {
  moxios.stubRequest(/\/ssr-sub\.txt.*/, {
    status: 200,
    responseText: fs.readFileSync(path.join(__dirname, 'asset/test-ssr-sub.txt'), {
      encoding: 'utf8',
    }),
  });

  const nodeList = await utils.getShadowsocksrSubscription({
    url: '/ssr-sub.txt',
  });

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
  });
});
