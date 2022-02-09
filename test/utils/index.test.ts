// tslint:disable:no-expression-statement
import test from 'ava';

import {
  NodeTypeEnum,
  ShadowsocksNodeConfig,
  SimpleNodeConfig,
  VmessNodeConfig,
  PossibleNodeConfigType,
} from '../../lib/types';
import * as utils from '../../lib/utils';
import {
  ERR_INVALID_FILTER,
  PROXY_TEST_INTERVAL,
  PROXY_TEST_URL,
} from '../../lib/constant';
import * as filter from '../../lib/utils/filter';

test('getSurgeNodes', async (t) => {
  const nodeList: ReadonlyArray<PossibleNodeConfigType> = [
    {
      nodeName: 'Test Node 1',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      obfs: 'tls',
      'obfs-host': 'example.com',
      'udp-relay': true,
    },
    {
      nodeName: 'Test Node 2',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example2.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
    },
    {
      enable: false,
      nodeName: 'Test Node 3',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example2.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
    },
    {
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
      localPort: 61100,
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
      binPath: '/usr/local/bin/v2ray',
      localPort: 61101,
    },
    {
      type: NodeTypeEnum.Vmess,
      alterId: '64',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: '测试 4',
      path: '/',
      port: 8080,
      tls: true,
      host: '',
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      binPath: '/usr/local/bin/v2ray',
      localPort: 61101,
      surgeConfig: {
        v2ray: 'native',
      },
    },
    {
      type: NodeTypeEnum.Vmess,
      alterId: '64',
      hostname: '1.1.1.1',
      method: 'aes-128-gcm',
      network: 'tcp',
      nodeName: '测试 5',
      path: '/',
      port: 8080,
      tls: false,
      host: '',
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      binPath: '/usr/local/bin/v2ray',
      localPort: 61101,
      surgeConfig: {
        v2ray: 'native',
      },
    },
    {
      nodeName: 'Test Node 4',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      obfs: 'tls',
      'obfs-host': 'example.com',
      'udp-relay': true,
      mptcp: true,
      surgeConfig: {
        shadowsocksFormat: 'ss',
      },
    },
    {
      nodeName: 'Test Node 5',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example2.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      mptcp: false,
      surgeConfig: {
        shadowsocksFormat: 'ss',
      },
    },
    {
      nodeName: 'Test Node 6',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example2.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      surgeConfig: {
        shadowsocksFormat: 'ss',
      },
    },
    {
      nodeName: 'Test Node 7',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example2.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      surgeConfig: {
        shadowsocksFormat: 'ss',
      },
      tfo: true,
      mptcp: true,
    },
    {
      type: NodeTypeEnum.Vmess,
      alterId: '64',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: '测试 6',
      path: '/',
      port: 8080,
      tls: true,
      tls13: true,
      skipCertVerify: true,
      host: '',
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      binPath: '/usr/local/bin/v2ray',
      localPort: 61101,
      surgeConfig: {
        v2ray: 'native',
      },
      tfo: true,
      mptcp: true,
    },
    {
      type: NodeTypeEnum.Vmess,
      alterId: '64',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: '测试 7',
      path: '/',
      port: 8080,
      tls: true,
      tls13: true,
      skipCertVerify: true,
      host: '',
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      binPath: '/usr/local/bin/v2ray',
      localPort: 61101,
      surgeConfig: {
        v2ray: 'native',
      },
      tfo: true,
      mptcp: true,
      underlyingProxy: 'another-proxy',
    },
  ];
  const txt1 = utils.getSurgeNodes(nodeList).split('\n');
  const txt2 = utils.getSurgeNodes(
    nodeList,
    (nodeConfig) => nodeConfig.nodeName === 'Test Node 1',
  );

  t.is(
    txt1[0],
    'Test Node 1 = custom, example.com, 443, chacha20-ietf-poly1305, password, https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module, udp-relay=true, obfs=tls, obfs-host=example.com',
  );
  t.is(
    txt1[1],
    'Test Node 2 = custom, example2.com, 443, chacha20-ietf-poly1305, password, https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module',
  );
  t.is(
    txt1[2],
    '测试中文 = external, exec = "/usr/local/bin/ssr-local", args = "-s", args = "127.0.0.1", args = "-p", args = "1234", args = "-m", args = "aes-128-cfb", args = "-o", args = "tls1.2_ticket_auth", args = "-O", args = "auth_aes128_md5", args = "-k", args = "aaabbb", args = "-l", args = "61100", args = "-b", args = "127.0.0.1", args = "-g", args = "breakwa11.moe", local-port = 61100, addresses = 127.0.0.1',
  );
  t.is(
    txt1[3],
    '测试 3 = external, exec = "/usr/local/bin/v2ray", args = "--config", args = "$HOME/.config/surgio/v2ray_61101_1.1.1.1_8080.json", local-port = 61101, addresses = 1.1.1.1',
  );
  t.is(
    txt1[4],
    '测试 4 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/, ws-headers="host:1.1.1.1|user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1", tls=true, vmess-aead=false',
  );
  t.is(
    txt1[5],
    '测试 5 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, encrypt-method=aes-128-gcm, vmess-aead=false',
  );
  t.is(
    txt1[6],
    'Test Node 4 = ss, example.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password, udp-relay=true, obfs=tls, obfs-host=example.com, mptcp=true',
  );
  t.is(
    txt1[7],
    'Test Node 5 = ss, example2.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password, mptcp=false',
  );
  t.is(
    txt1[8],
    'Test Node 6 = ss, example2.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password',
  );
  t.is(
    txt1[9],
    'Test Node 7 = ss, example2.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password, tfo=true, mptcp=true',
  );
  t.is(
    txt1[10],
    '测试 6 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/, ws-headers="host:1.1.1.1|user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1", tls=true, tls13=true, skip-cert-verify=true, tfo=true, mptcp=true, vmess-aead=false',
  );
  t.is(
    txt1[11],
    '测试 7 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/, ws-headers="host:1.1.1.1|user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1", tls=true, tls13=true, skip-cert-verify=true, tfo=true, mptcp=true, underlying-proxy=another-proxy, vmess-aead=false',
  );

  t.is(
    txt2,
    'Test Node 1 = custom, example.com, 443, chacha20-ietf-poly1305, password, https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module, udp-relay=true, obfs=tls, obfs-host=example.com',
  );

  t.is(
    utils.getSurgeNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan node 1',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
      },
    ]),
    'trojan node 1 = trojan, example.com, 443, password=password1',
  );

  t.is(
    utils.getSurgeNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan node 2',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        sni: 'sni.com',
        tfo: true,
        mptcp: true,
        skipCertVerify: true,
      },
    ]),
    'trojan node 2 = trojan, example.com, 443, password=password1, tfo=true, mptcp=true, sni=sni.com, skip-cert-verify=true',
  );

  t.is(
    utils.getSurgeNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks5-tls node 1',
        hostname: '1.1.1.1',
        port: 443,
        tls: true,
      },
    ]),
    'socks5-tls node 1 = socks5-tls, 1.1.1.1, 443',
  );

  t.is(
    utils.getSurgeNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks5-tls node 2',
        hostname: '1.1.1.1',
        port: 443,
        tfo: true,
        tls: true,
      },
    ]),
    'socks5-tls node 2 = socks5-tls, 1.1.1.1, 443, tfo=true',
  );

  t.is(
    utils.getSurgeNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks5-tls node 3',
        hostname: '1.1.1.1',
        port: 443,
        username: 'auto',
        password: 'auto',
        tls: true,
      },
    ]),
    'socks5-tls node 3 = socks5-tls, 1.1.1.1, 443, username=auto, password=auto',
  );

  t.is(
    utils.getSurgeNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks5-tls node 4',
        hostname: '1.1.1.1',
        port: 443,
        username: 'auto',
        password: 'auto',
        skipCertVerify: true,
        sni: 'example.com',
        tfo: true,
        tls: true,
      },
    ]),
    'socks5-tls node 4 = socks5-tls, 1.1.1.1, 443, username=auto, password=auto, sni=example.com, tfo=true, skip-cert-verify=true',
  );

  t.is(
    utils.getSurgeNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks5-tls node 5',
        hostname: '1.1.1.1',
        port: 443,
        username: 'auto',
        password: 'auto',
        skipCertVerify: true,
        sni: 'example.com',
        tfo: true,
        clientCert: 'item',
        tls: true,
      },
    ]),
    'socks5-tls node 5 = socks5-tls, 1.1.1.1, 443, username=auto, password=auto, sni=example.com, tfo=true, skip-cert-verify=true, client-cert=item',
  );

  t.is(
    utils.getSurgeNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks node 1',
        hostname: '1.1.1.1',
        port: '80',
      },
    ]),
    'socks node 1 = socks5, 1.1.1.1, 80',
  );

  t.is(
    utils.getSurgeNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks node 2',
        hostname: '1.1.1.1',
        port: '80',
        tfo: true,
      },
    ]),
    'socks node 2 = socks5, 1.1.1.1, 80, tfo=true',
  );

  t.is(
    utils.getSurgeNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks node 3',
        hostname: '1.1.1.1',
        port: '80',
        username: 'auto',
        password: 'auto',
        tfo: true,
      },
    ]),
    'socks node 3 = socks5, 1.1.1.1, 80, username=auto, password=auto, tfo=true',
  );

  t.is(
    utils.getSurgeNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'ws',
        nodeName: '测试 6',
        path: '/',
        port: 8080,
        tls: true,
        tls13: true,
        skipCertVerify: true,
        host: '',
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        binPath: '/usr/local/bin/v2ray',
        localPort: 61101,
        surgeConfig: {
          v2ray: 'native',
        },
        tfo: true,
        mptcp: true,
        testUrl: 'http://www.google.com',
      },
    ]),
    '测试 6 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/, ws-headers="host:1.1.1.1|user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1", tls=true, tls13=true, skip-cert-verify=true, tfo=true, mptcp=true, test-url=http://www.google.com, vmess-aead=false',
  );
});

test('getNodeNames', async (t) => {
  const nodeNameList: ReadonlyArray<SimpleNodeConfig> = [
    {
      type: NodeTypeEnum.Shadowsocks,
      enable: true,
      nodeName: 'Test Node 1',
    },
    {
      type: NodeTypeEnum.Shadowsocks,
      enable: false,
      nodeName: 'Test Node 2',
    },
    {
      type: NodeTypeEnum.Snell,
      enable: true,
      nodeName: 'Test Node 3',
    },
  ];
  const txt1 = utils.getNodeNames(nodeNameList);
  const txt2 = utils.getNodeNames(nodeNameList, undefined, ':');
  const txt3 = utils.getNodeNames(
    nodeNameList,
    (simpleNodeConfig) => simpleNodeConfig.nodeName !== 'Test Node 3',
  );

  t.is(txt1, 'Test Node 1, Test Node 3');
  t.is(txt2, 'Test Node 1:Test Node 3');
  t.is(txt3, 'Test Node 1');
});

test('getClashNodeNames', async (t) => {
  const nodeNameList: ReadonlyArray<SimpleNodeConfig> = [
    {
      type: NodeTypeEnum.Shadowsocks,
      enable: true,
      nodeName: 'Test Node 1',
    },
    {
      type: NodeTypeEnum.Shadowsocks,
      enable: false,
      nodeName: 'Test Node 2',
    },
    {
      type: NodeTypeEnum.Snell,
      enable: true,
      nodeName: 'Test Node 3',
    },
  ];
  const result1 = utils.getClashNodeNames(nodeNameList);
  const result2 = utils.getClashNodeNames(nodeNameList, undefined, ['TEST']);
  const result3 = utils.getClashNodeNames(
    nodeNameList,
    (simpleNodeConfig) => simpleNodeConfig.nodeName !== 'Test Node 3',
  );

  t.deepEqual(result1, ['Test Node 1', 'Test Node 3']);
  t.deepEqual(result2, ['TEST', 'Test Node 1', 'Test Node 3']);
  t.deepEqual(result3, ['Test Node 1']);
});

test('getClashNodes', async (t) => {
  const nodeList: ReadonlyArray<PossibleNodeConfigType> = [
    {
      nodeName: 'Test Node 1',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      obfs: 'tls',
      'obfs-host': 'example.com',
      'udp-relay': true,
    },
    {
      nodeName: 'Test Node 2',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example2.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
    },
    {
      alterId: '64',
      host: 'example.com',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: 'Test Node 3',
      path: '/',
      port: 8080,
      tls: false,
      skipCertVerify: true,
      type: NodeTypeEnum.Vmess,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    },
    {
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
    },
    {
      alterId: '64',
      host: '',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'tcp',
      nodeName: 'Test Node 5',
      path: '/',
      port: 8080,
      tls: true,
      type: NodeTypeEnum.Vmess,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    },
    {
      alterId: '64',
      host: '',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'tcp',
      nodeName: 'Test Node 6',
      path: '/',
      port: 8080,
      tls: true,
      skipCertVerify: false,
      type: NodeTypeEnum.Vmess,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    },
    {
      alterId: '64',
      host: '',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'tcp',
      nodeName: 'Test Node 7',
      path: '/',
      port: 8080,
      tls: true,
      skipCertVerify: true,
      type: NodeTypeEnum.Vmess,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    },
    {
      alterId: '32',
      host: 'example.com',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: 'Test Node 8',
      port: 443,
      'udp-relay': true,
      tls: true,
      skipCertVerify: true,
      type: NodeTypeEnum.Vmess,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      protocolOpts: {
        path: '/path',
        headers: {
          Host: 'v2ray.com',
        },
        'max-early-data': 2048,
        'early-data-header-name': 'Sec-WebSocket-Protocol',
      },
    },
    {
      alterId: '32',
      host: '',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'h2',
      nodeName: 'Test Node 9',
      port: 443,
      tls: true,
      type: NodeTypeEnum.Vmess,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      protocolOpts: {
        path: '/',
        host: ['http.example.com', 'http-alt.example.com'],
      },
    },
    {
      alterId: '32',
      host: 'example.com',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'grpc',
      nodeName: 'Test Node 10',
      port: 443,
      tls: true,
      skipCertVerify: true,
      type: NodeTypeEnum.Vmess,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      protocolOpts: {
        'grpc-service-name': 'example',
      },
    },
  ];
  const array = utils.getClashNodes(nodeList);

  t.is(array.length, nodeList.length);
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
    udp: false,
    type: 'vmess',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    'ws-opts': {
      headers: {
        Host: 'example.com',
      },
      path: '/',
    },
  });
  t.deepEqual(array[3], {
    cipher: 'auto',
    name: 'Test Node 4',
    alterId: '64',
    server: '1.1.1.1',
    port: 8080,
    tls: false,
    type: 'vmess',
    udp: false,
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  });
  t.deepEqual(array[4], {
    cipher: 'auto',
    name: 'Test Node 5',
    alterId: '64',
    server: '1.1.1.1',
    port: 8080,
    tls: true,
    type: 'vmess',
    udp: false,
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  });
  t.deepEqual(array[5], {
    cipher: 'auto',
    name: 'Test Node 6',
    alterId: '64',
    server: '1.1.1.1',
    port: 8080,
    tls: true,
    udp: false,
    'skip-cert-verify': false,
    type: 'vmess',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  });
  t.deepEqual(array[6], {
    cipher: 'auto',
    name: 'Test Node 7',
    alterId: '64',
    server: '1.1.1.1',
    port: 8080,
    tls: true,
    udp: false,
    'skip-cert-verify': true,
    type: 'vmess',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  });
  t.deepEqual(array[7], {
    name: 'Test Node 8',
    type: 'vmess',
    server: '1.1.1.1',
    port: 443,
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    alterId: '32',
    cipher: 'auto',
    udp: true,
    tls: true,
    'skip-cert-verify': true,
    servername: 'example.com',
    network: 'ws',
    'ws-opts': {
      path: '/path',
      headers: {
        Host: 'v2ray.com',
      },
      'max-early-data': 2048,
      'early-data-header-name': 'Sec-WebSocket-Protocol',
    },
  });
  t.deepEqual(array[8], {
    name: 'Test Node 9',
    type: 'vmess',
    server: '1.1.1.1',
    port: 443,
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    alterId: '32',
    cipher: 'auto',
    network: 'h2',
    udp: false,
    tls: true,
    'h2-opts': {
      host: ['http.example.com', 'http-alt.example.com'],
      path: '/',
    },
  });
  t.deepEqual(array[9], {
    name: 'Test Node 10',
    server: '1.1.1.1',
    port: 443,
    type: 'vmess',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    alterId: '32',
    cipher: 'auto',
    network: 'grpc',
    udp: false,
    tls: true,
    servername: 'example.com',
    'skip-cert-verify': true,
    'grpc-opts': {
      'grpc-service-name': 'example',
    },
  });

  t.deepEqual(
    utils.getClashNodes([
      {
        alterId: '64',
        host: '',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: 'Test',
        path: '/',
        port: 8080,
        tls: true,
        'udp-relay': true,
        skipCertVerify: true,
        type: NodeTypeEnum.Vmess,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
    ]),
    [
      {
        alterId: '64',
        cipher: 'auto',
        name: 'Test',
        port: 8080,
        server: '1.1.1.1',
        'skip-cert-verify': true,
        tls: true,
        type: 'vmess',
        udp: true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
    ],
  );

  t.deepEqual(
    utils.getClashNodes([
      {
        nodeName: 'snell',
        type: NodeTypeEnum.Snell,
        hostname: '1.1.1.1',
        port: 443,
        psk: 'psk',
        obfs: 'tls',
      },
    ]),
    [
      {
        name: 'snell',
        type: 'snell',
        server: '1.1.1.1',
        port: 443,
        psk: 'psk',
        'obfs-opts': {
          mode: 'tls',
        },
      },
    ],
  );
  t.deepEqual(
    utils.getClashNodes([
      {
        nodeName: 'snell',
        type: NodeTypeEnum.Snell,
        hostname: '1.1.1.1',
        port: 443,
        psk: 'psk',
        obfs: 'tls',
        'obfs-host': 'example.com',
        version: '2',
      },
    ]),
    [
      {
        name: 'snell',
        type: 'snell',
        server: '1.1.1.1',
        port: 443,
        psk: 'psk',
        'obfs-opts': {
          mode: 'tls',
          host: 'example.com',
        },
        version: '2',
      },
    ],
  );
  t.deepEqual(
    utils.getClashNodes([
      {
        nodeName: 'snell',
        enable: false,
        type: NodeTypeEnum.Snell,
        hostname: '1.1.1.1',
        port: 443,
        psk: 'psk',
        obfs: 'tls',
      },
    ]),
    [],
  );
  t.deepEqual(
    utils.getClashNodes([
      {
        nodeName: 'trojan',
        type: NodeTypeEnum.Trojan,
        hostname: '1.1.1.1',
        port: 443,
        password: 'password1',
      },
    ]),
    [
      {
        name: 'trojan',
        type: 'trojan',
        server: '1.1.1.1',
        port: 443,
        password: 'password1',
        'skip-cert-verify': false,
      },
    ],
  );
  t.deepEqual(
    utils.getClashNodes([
      {
        nodeName: 'trojan',
        type: NodeTypeEnum.Trojan,
        hostname: '1.1.1.1',
        port: 443,
        password: 'password1',
        'udp-relay': true,
        alpn: ['h2', 'http/1.1'],
        sni: 'example.com',
        skipCertVerify: true,
      },
    ]),
    [
      {
        name: 'trojan',
        type: 'trojan',
        server: '1.1.1.1',
        port: 443,
        password: 'password1',
        udp: true,
        alpn: ['h2', 'http/1.1'],
        sni: 'example.com',
        'skip-cert-verify': true,
      },
    ],
  );

  t.deepEqual(
    utils.getClashNodes([
      {
        nodeName: 'socks5',
        type: NodeTypeEnum.Socks5,
        hostname: '1.1.1.1',
        port: 443,
      },
    ]),
    [
      {
        type: 'socks5',
        name: 'socks5',
        server: '1.1.1.1',
        port: 443,
      },
    ],
  );

  t.deepEqual(
    utils.getClashNodes([
      {
        nodeName: 'socks5',
        type: NodeTypeEnum.Socks5,
        hostname: '1.1.1.1',
        port: 443,
        username: 'username',
        password: 'password',
        tls: true,
        skipCertVerify: true,
        udpRelay: false,
      },
    ]),
    [
      {
        type: 'socks5',
        name: 'socks5',
        server: '1.1.1.1',
        port: 443,
        username: 'username',
        password: 'password',
        tls: true,
        'skip-cert-verify': true,
        udp: false,
      },
    ],
  );

  t.deepEqual(
    utils.getClashNodes([
      {
        nodeName: 'socks5',
        type: NodeTypeEnum.Socks5,
        hostname: '1.1.1.1',
        port: 443,
        username: 'username',
        password: 'password',
        tls: false,
        skipCertVerify: false,
        udpRelay: false,
      },
    ]),
    [
      {
        type: 'socks5',
        name: 'socks5',
        server: '1.1.1.1',
        port: 443,
        username: 'username',
        password: 'password',
        tls: false,
        'skip-cert-verify': false,
        udp: false,
      },
    ],
  );
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
      'obfs-host': 'gateway.icloud.com',
      'udp-relay': true,
    },
  ];
  const txt1 = utils.getShadowsocksNodes(nodeList, 'GroupName');

  t.is(
    txt1,
    'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@example.com:8443/?plugin=obfs-local%3Bobfs%3Dtls%3Bobfs-host%3Dgateway.icloud.com&group=GroupName#%F0%9F%87%AD%F0%9F%87%B0HK(Example)',
  );
});

test('getMellowNodes', async (t) => {
  const nodeList: ReadonlyArray<VmessNodeConfig | ShadowsocksNodeConfig> = [
    {
      alterId: '64',
      host: 'example.com',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: 'Test Node 3',
      path: '/',
      port: 8080,
      tls: false,
      skipCertVerify: false,
      type: NodeTypeEnum.Vmess,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    },
    {
      alterId: '64',
      host: 'example.com',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: 'Test Node 3',
      path: '/',
      port: 8080,
      tls: true,
      skipCertVerify: true,
      type: NodeTypeEnum.Vmess,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      wsHeaders: {
        foo: 'bar',
      },
    },
    {
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
    },
    {
      alterId: '64',
      host: '',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'tcp',
      nodeName: 'Test Node 5',
      path: '/',
      port: 8080,
      tls: true,
      type: NodeTypeEnum.Vmess,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    },
    {
      nodeName: '🇭🇰HK(Example)',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example.com',
      port: '8443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      obfs: 'tls',
      'obfs-host': 'gateway.icloud.com',
      'udp-relay': true,
    },
  ];

  t.snapshot(utils.getMellowNodes(nodeList));
  t.snapshot(
    utils.getMellowNodes(
      nodeList,
      (nodeConfig) => nodeConfig.nodeName === 'Test Node 5',
    ),
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

test('normalizeClashProxyGroupConfig', (t) => {
  function proxyGroupModifier(_, filters): any {
    return [
      {
        name: '🚀 Proxy',
        type: 'select',
      },
      {
        name: '🚀 Proxy 2',
        type: 'select',
        proxies: ['Another Proxy'],
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
      {
        name: 'Mixed',
        filter: filters.hkFilter,
        proxies: ['DIRECT'],
        type: 'url-test',
      },
      {
        name: 'load-balance',
        filter: filters.hkFilter,
        proxies: ['🚀 Proxy', 'US'],
        type: 'load-balance',
      },
      {
        name: 'fallback-auto',
        filter: filters.hkFilter,
        proxies: ['🚀 Proxy', 'US'],
        type: 'fallback',
      },
      {
        name: 'fallback-auto-no-filter',
        proxies: ['🚀 Proxy', 'US'],
        type: 'fallback',
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
      name: '🚀 Proxy 2',
      type: 'select',
      proxies: ['Another Proxy'],
    },
    {
      name: 'US',
      type: 'url-test',
      proxies: [],
      url: PROXY_TEST_URL,
      interval: PROXY_TEST_INTERVAL,
    },
    {
      name: 'HK',
      type: 'url-test',
      proxies: ['🇭🇰HK(Example)'],
      url: PROXY_TEST_URL,
      interval: PROXY_TEST_INTERVAL,
    },
    {
      name: '🍎 Apple',
      proxies: ['DIRECT', '🚀 Proxy', 'US'],
      type: 'select',
    },
    {
      name: 'Mixed',
      proxies: ['DIRECT', '🇭🇰HK(Example)'],
      type: 'url-test',
      url: PROXY_TEST_URL,
      interval: PROXY_TEST_INTERVAL,
    },
    {
      name: 'load-balance',
      type: 'load-balance',
      proxies: ['🚀 Proxy', 'US', '🇭🇰HK(Example)'],
      url: PROXY_TEST_URL,
      interval: PROXY_TEST_INTERVAL,
    },
    {
      name: 'fallback-auto',
      type: 'fallback',
      proxies: ['🚀 Proxy', 'US', '🇭🇰HK(Example)'],
      url: PROXY_TEST_URL,
      interval: PROXY_TEST_INTERVAL,
    },
    {
      name: 'fallback-auto-no-filter',
      type: 'fallback',
      proxies: ['🚀 Proxy', 'US'],
      url: PROXY_TEST_URL,
      interval: PROXY_TEST_INTERVAL,
    },
  ];

  t.deepEqual(
    utils.normalizeClashProxyGroupConfig(
      [
        {
          nodeName: '🇭🇰HK(Example)',
          type: NodeTypeEnum.Shadowsocks,
          hostname: 'example.com',
          port: '8443',
          method: 'chacha20-ietf-poly1305',
          password: 'password',
        },
      ],
      {
        hkFilter: filter.hkFilter,
        usFilter: filter.usFilter,
      },
      proxyGroupModifier as any,
      {
        proxyTestUrl: PROXY_TEST_URL,
        proxyTestInterval: PROXY_TEST_INTERVAL,
      },
    ),
    result,
  );
});

test('getShadowsocksJSONConfig', async (t) => {
  const config = await utils.getShadowsocksJSONConfig(
    'http://example.com/gui-config.json?v=1',
    true,
  );
  const config2 = await utils.getShadowsocksJSONConfig(
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
    'udp-relay': true,
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
    'udp-relay': true,
  });
  t.deepEqual(config[2], {
    nodeName: '🇺🇸US 3',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 445,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    'udp-relay': true,
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
    'udp-relay': true,
    obfs: 'http',
    'obfs-host': 'www.bing.com',
  });
  t.deepEqual(config2[0], {
    nodeName: '🇺🇸US 1',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    'udp-relay': false,
    obfs: 'tls',
    'obfs-host': 'gateway-carry.icloud.com',
  });
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

test('getQuantumultNodes', (t) => {
  const schemeList = utils
    .getQuantumultNodes([
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
        'udp-relay': true,
        obfs: 'tls',
        'obfs-host': 'gateway-carry.icloud.com',
      },
    ])
    .split('\n');

  t.is(
    schemeList[0],
    'vmess://5rWL6K+VIDEgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXdzLG9iZnMtcGF0aD0iLyIsb2Jmcy1oZWFkZXI9Imhvc3Q6ZXhhbXBsZS5jb21bUnJdW05uXXVzZXItYWdlbnQ6TW96aWxsYS81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxM181IGxpa2UgTWFjIE9TIFgpIEFwcGxlV2ViS2l0LzYwNS4xLjE1IChLSFRNTCwgbGlrZSBHZWNrbykgVmVyc2lvbi8xMy4xLjEgTW9iaWxlLzE1RTE0OCBTYWZhcmkvNjA0LjEi',
  );
  t.is(
    schemeList[1],
    'vmess://5rWL6K+VIDIgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXRjcCxvYmZzLXBhdGg9Ii8iLG9iZnMtaGVhZGVyPSJob3N0OjEuMS4xLjFbUnJdW05uXXVzZXItYWdlbnQ6TW96aWxsYS81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxM181IGxpa2UgTWFjIE9TIFgpIEFwcGxlV2ViS2l0LzYwNS4xLjE1IChLSFRNTCwgbGlrZSBHZWNrbykgVmVyc2lvbi8xMy4xLjEgTW9iaWxlLzE1RTE0OCBTYWZhcmkvNjA0LjEi',
  );
  t.is(
    schemeList[2],
    'vmess://5rWL6K+VIDMgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXdzLG9iZnMtcGF0aD0iLyIsb2Jmcy1oZWFkZXI9Imhvc3Q6MS4xLjEuMVtScl1bTm5ddXNlci1hZ2VudDpNb3ppbGxhLzUuMCAoaVBob25lOyBDUFUgaVBob25lIE9TIDEzXzUgbGlrZSBNYWMgT1MgWCkgQXBwbGVXZWJLaXQvNjA1LjEuMTUgKEtIVE1MLCBsaWtlIEdlY2tvKSBWZXJzaW9uLzEzLjEuMSBNb2JpbGUvMTVFMTQ4IFNhZmFyaS82MDQuMSI=',
  );
  t.is(
    schemeList[3],
    'ssr://aGsuZXhhbXBsZS5jb206MTAwMDA6YXV0aF9hZXMxMjhfbWQ1OmNoYWNoYTIwLWlldGY6dGxzMS4yX3RpY2tldF9hdXRoOmNHRnpjM2R2Y21RLz9ncm91cD1VM1Z5WjJsdiZvYmZzcGFyYW09YlhWemFXTXVNVFl6TG1OdmJRJnByb3RvcGFyYW09JnJlbWFya3M9OEotSHJmQ2ZoN0JJU3cmdWRwcG9ydD0wJnVvdD0w',
  );
  t.is(
    schemeList[4],
    'http://dGVzdCA9IGh0dHAsIHVwc3RyZWFtLXByb3h5LWFkZHJlc3M9YS5jb20sIHVwc3RyZWFtLXByb3h5LXBvcnQ9NDQzLCB1cHN0cmVhbS1wcm94eS1hdXRoPXRydWUsIHVwc3RyZWFtLXByb3h5LXVzZXJuYW1lPXNuc21zLCB1cHN0cmVhbS1wcm94eS1wYXNzd29yZD1ubmRuZG5kLCBvdmVyLXRscz10cnVlLCBjZXJ0aWZpY2F0ZT0x',
  );
  t.is(
    schemeList[5],
    'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@us.example.com:443/?plugin=obfs-local%3Bobfs%3Dtls%3Bobfs-host%3Dgateway-carry.icloud.com&group=Surgio#%F0%9F%87%BA%F0%9F%87%B8US%201',
  );
});

test('getQuantumultNodes with filter', (t) => {
  const schemeList = utils
    .getQuantumultNodes(
      [
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
      ],
      undefined,
      (item) => item.nodeName === '测试 1',
    )
    .split('\n');

  t.is(
    schemeList[0],
    'vmess://5rWL6K+VIDEgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXdzLG9iZnMtcGF0aD0iLyIsb2Jmcy1oZWFkZXI9Imhvc3Q6ZXhhbXBsZS5jb21bUnJdW05uXXVzZXItYWdlbnQ6TW96aWxsYS81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxM181IGxpa2UgTWFjIE9TIFgpIEFwcGxlV2ViS2l0LzYwNS4xLjE1IChLSFRNTCwgbGlrZSBHZWNrbykgVmVyc2lvbi8xMy4xLjEgTW9iaWxlLzE1RTE0OCBTYWZhcmkvNjA0LjEi',
  );
});

test('getQuantumultXNodes', (t) => {
  const schemeList = utils
    .getQuantumultXNodes([
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
        'udp-relay': true,
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
        'udp-relay': true,
        obfs: 'tls',
        'obfs-host': 'gateway-carry.icloud.com',
        tfo: true,
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试 4',
        port: 443,
        tls: true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
    ])
    .split('\n');

  t.is(
    schemeList[0],
    'vmess=1.1.1.1:8080, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, aead=false, obfs=ws, obfs-uri=/, obfs-host=example.com, tag=测试 1',
  );
  t.is(
    schemeList[1],
    'vmess=1.1.1.1:8080, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, aead=false, tag=测试 2',
  );
  t.is(
    schemeList[2],
    'vmess=1.1.1.1:8080, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, udp-relay=true, aead=false, obfs=ws, obfs-uri=/, obfs-host=1.1.1.1, tag=测试 3',
  );
  t.is(
    schemeList[3],
    'shadowsocks=hk.example.com:10000, method=chacha20-ietf, password=password, ssr-protocol=auth_aes128_md5, ssr-protocol-param=, obfs=tls1.2_ticket_auth, obfs-host=music.163.com, tag=🇭🇰HK',
  );
  t.is(
    schemeList[4],
    'http=a.com:443, username=snsms, password=nndndnd, over-tls=true, tls-verification=true, tag=test',
  );
  t.is(
    schemeList[5],
    'shadowsocks=us.example.com:443, method=chacha20-ietf-poly1305, password=password, obfs=tls, obfs-host=gateway-carry.icloud.com, udp-relay=true, fast-open=true, tag=🇺🇸US 1',
  );
  t.is(
    schemeList[6],
    'vmess=1.1.1.1:443, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, aead=false, obfs=over-tls, tag=测试 4',
  );

  t.is(
    utils.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试',
        port: 443,
        tls: true,
        tls13: true,
        'udp-relay': true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
    ]),
    'vmess=1.1.1.1:443, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, udp-relay=true, aead=false, obfs=over-tls, tls13=true, tag=测试',
  );

  t.is(
    utils.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试',
        port: 443,
        tls: true,
        tls13: true,
        'udp-relay': true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        quantumultXConfig: {
          vmessAEAD: true,
        },
      },
    ]),
    'vmess=1.1.1.1:443, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, udp-relay=true, aead=true, obfs=over-tls, tls13=true, tag=测试',
  );
  t.is(
    utils.getQuantumultXNodes([
      {
        type: NodeTypeEnum.HTTPS,
        nodeName: 'test',
        hostname: 'a.com',
        port: 443,
        tls13: true,
        username: 'snsms',
        password: 'nndndnd',
      },
    ]),
    'http=a.com:443, username=snsms, password=nndndnd, over-tls=true, tls-verification=true, tls13=true, tag=test',
  );
  t.is(
    utils.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
      },
    ]),
    'trojan=example.com:443, password=password1, over-tls=true, tls-verification=true, tag=trojan',
  );
  t.is(
    utils.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        'udp-relay': true,
        skipCertVerify: true,
        tfo: true,
      },
    ]),
    'trojan=example.com:443, password=password1, over-tls=true, tls-verification=false, fast-open=true, udp-relay=true, tag=trojan',
  );
  t.is(
    utils.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        sni: 'sni.example.com',
        'udp-relay': true,
        skipCertVerify: true,
        tfo: true,
        tls13: true,
      },
    ]),
    'trojan=example.com:443, password=password1, over-tls=true, tls-verification=false, tls-host=sni.example.com, fast-open=true, udp-relay=true, tls13=true, tag=trojan',
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

test('output api should fail with invalid filter', (t) => {
  t.throws(
    () => {
      utils.getSurgeNodes([], undefined);
    },
    undefined,
    ERR_INVALID_FILTER,
  );
  t.throws(
    () => {
      utils.getClashNodes([], undefined);
    },
    undefined,
    ERR_INVALID_FILTER,
  );
  t.throws(
    () => {
      utils.getClashNodeNames([], undefined);
    },
    undefined,
    ERR_INVALID_FILTER,
  );
  t.throws(
    () => {
      utils.getNodeNames([], undefined);
    },
    undefined,
    ERR_INVALID_FILTER,
  );
  t.throws(
    () => {
      utils.getQuantumultNodes([], undefined, undefined);
    },
    undefined,
    ERR_INVALID_FILTER,
  );
  t.throws(
    () => {
      utils.getQuantumultXNodes([], undefined);
    },
    undefined,
    ERR_INVALID_FILTER,
  );
  t.throws(
    () => {
      utils.getMellowNodes([], undefined);
    },
    undefined,
    ERR_INVALID_FILTER,
  );
});

test('isIp', (t) => {
  t.true(utils.isIp('0.0.0.0'));
  t.true(utils.isIp('255.255.255.255'));
  t.false(utils.isIp('256.256.256.256'));
  t.false(utils.isIp('example.com'));
});
