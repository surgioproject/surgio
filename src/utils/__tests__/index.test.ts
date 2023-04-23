// tslint:disable:no-expression-statement
import test from 'ava';

import {
  NodeTypeEnum,
  PossibleNodeConfigType,
  ShadowsocksNodeConfig,
} from '../../types';
import * as utils from '../index';

test('getNodeNames', async (t) => {
  const nodeList: ReadonlyArray<PossibleNodeConfigType> = [
    {
      type: NodeTypeEnum.Shadowsocks,
      enable: true,
      nodeName: 'Test Node 1',
      hostname: 'example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
    },
    {
      type: NodeTypeEnum.Shadowsocks,
      enable: false,
      nodeName: 'Test Node 2',
      hostname: 'example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
    },
    {
      type: NodeTypeEnum.Shadowsocks,
      enable: true,
      nodeName: 'Test Node 3',
      hostname: 'example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
    },
  ] as const;
  const txt1 = utils.getNodeNames(nodeList);
  const txt2 = utils.getNodeNames(nodeList, undefined, ':');
  const txt3 = utils.getNodeNames(
    nodeList,
    (nodeConfig) => nodeConfig.nodeName !== 'Test Node 3',
  );

  t.is(txt1, 'Test Node 1, Test Node 3');
  t.is(txt2, 'Test Node 1:Test Node 3');
  t.is(txt3, 'Test Node 1');
});

test('getShadowsocksNodes', async (t) => {
  const nodeList: ReadonlyArray<ShadowsocksNodeConfig> = [
    {
      nodeName: '🇭🇰HK(Example)',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example.com',
      port: '8443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      obfs: 'tls',
      obfsHost: 'gateway.icloud.com',
      udpRelay: true,
    },
  ];
  const txt1 = utils.getShadowsocksNodes(nodeList, 'GroupName');

  t.is(
    txt1,
    'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@example.com:8443/?plugin=obfs-local%3Bobfs%3Dtls%3Bobfs-host%3Dgateway.icloud.com&group=GroupName#%F0%9F%87%AD%F0%9F%87%B0HK(Example)',
  );
});

test('getDownloadUrl', (t) => {
  t.is(
    utils.getDownloadUrl('http://example.com/', 'test.conf'),
    'http://example.com/test.conf',
  );
  t.is(utils.getDownloadUrl(undefined, 'test.conf'), '/test.conf');
  t.is(utils.getDownloadUrl(undefined, 'test.conf', false), '/test.conf?dl=1');
  t.is(
    utils.getDownloadUrl(undefined, 'test.conf', undefined, 'abcd'),
    '/test.conf?access_token=abcd',
  );
  t.is(
    utils.getDownloadUrl(
      'http://example.com/',
      'test.conf?foo=bar',
      undefined,
      'abcd',
    ),
    'http://example.com/test.conf?foo=bar&access_token=abcd',
  );
});

test('getV2rayNNodes', (t) => {
  const schemeList = utils
    .getV2rayNNodes([
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

  t.is(
    schemeList[0],
    'vmess://eyJ2IjoiMiIsInBzIjoi5rWL6K+VIDEiLCJhZGQiOiIxLjEuMS4xIiwicG9ydCI6IjgwODAiLCJpZCI6IjEzODZmODVlLTY1N2ItNGQ2ZS05ZDU2LTc4YmFkYjc1ZTFmZCIsImFpZCI6IjY0IiwibmV0Ijoid3MiLCJ0eXBlIjoibm9uZSIsImhvc3QiOiJleGFtcGxlLmNvbSIsInBhdGgiOiIvIiwidGxzIjoiIn0=',
  );
  t.is(
    schemeList[1],
    'vmess://eyJ2IjoiMiIsInBzIjoi5rWL6K+VIDIiLCJhZGQiOiIxLjEuMS4xIiwicG9ydCI6IjgwODAiLCJpZCI6IjEzODZmODVlLTY1N2ItNGQ2ZS05ZDU2LTc4YmFkYjc1ZTFmZCIsImFpZCI6IjY0IiwibmV0IjoidGNwIiwidHlwZSI6Im5vbmUiLCJob3N0IjoiIiwicGF0aCI6Ii8iLCJ0bHMiOiJ0bHMifQ==',
  );
  t.is(
    schemeList[2],
    'vmess://eyJ2IjoiMiIsInBzIjoi5rWL6K+VIDMiLCJhZGQiOiIxLjEuMS4xIiwicG9ydCI6IjgwODAiLCJpZCI6IjEzODZmODVlLTY1N2ItNGQ2ZS05ZDU2LTc4YmFkYjc1ZTFmZCIsImFpZCI6IjY0IiwibmV0Ijoid3MiLCJ0eXBlIjoibm9uZSIsImhvc3QiOiIiLCJwYXRoIjoiLyIsInRscyI6IiJ9',
  );
});

test('formatV2rayConfig', (t) => {
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
  const json2 = utils.formatV2rayConfig(100, {
    type: NodeTypeEnum.Vmess,
    alterId: '64',
    hostname: '1.1.1.1',
    method: 'auto',
    network: 'ws',
    nodeName: '测试 4',
    path: '/',
    port: 8080,
    tls: true,
    tls13: true,
    skipCertVerify: true,
    host: '',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  });

  t.deepEqual(json, {
    log: {
      loglevel: 'warning',
    },
    inbound: {
      port: 100,
      listen: '127.0.0.1',
      protocol: 'socks',
      settings: {
        auth: 'noauth',
      },
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
              },
            ],
          },
        ],
      },
      streamSettings: {
        network: 'ws',
        security: 'none',
        wsSettings: {
          headers: {
            Host: '',
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1',
          },
          path: '/',
        },
      },
    },
  });
  t.deepEqual(json2, {
    log: {
      loglevel: 'warning',
    },
    inbound: {
      port: 100,
      listen: '127.0.0.1',
      protocol: 'socks',
      settings: {
        auth: 'noauth',
      },
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
              },
            ],
          },
        ],
      },
      streamSettings: {
        security: 'tls',
        network: 'ws',
        tlsSettings: {
          serverName: '1.1.1.1',
          allowInsecure: true,
          allowInsecureCiphers: false,
        },
        wsSettings: {
          headers: {
            Host: '',
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1',
          },
          path: '/',
        },
      },
    },
  });
});

test('isIp', (t) => {
  t.true(utils.isIp('0.0.0.0'));
  t.true(utils.isIp('255.255.255.255'));
  t.false(utils.isIp('256.256.256.256'));
  t.false(utils.isIp('example.com'));
});
