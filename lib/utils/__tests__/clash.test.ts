import test from 'ava';

import {
  NodeTypeEnum,
  PossibleNodeConfigType,
  SimpleNodeConfig,
} from '../../types';
import * as clash from '../clash';

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
  const result1 = clash.getClashNodeNames(nodeNameList);
  const result2 = clash.getClashNodeNames(nodeNameList, undefined, ['TEST']);
  const result3 = clash.getClashNodeNames(
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
  ];
  const array = clash.getClashNodes(nodeList);

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
        host: 'example.com',
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

  t.deepEqual(
    clash.getClashNodes([
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
    clash.getClashNodes([
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
    clash.getClashNodes([
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
    clash.getClashNodes([
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
    clash.getClashNodes([
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
    clash.getClashNodes([
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
    clash.getClashNodes([
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
        network: 'ws',
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
        network: 'ws',
        'ws-opts': {
          path: '/',
        },
      },
    ],
  );
  t.deepEqual(
    clash.getClashNodes([
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
        network: 'ws',
        wsHeaders: {
          'multi words key': 'multi words value',
        },
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
        network: 'ws',
        'ws-opts': {
          'multi words key': 'multi words value',
          path: '/',
        },
      },
    ],
  );

  t.deepEqual(
    clash.getClashNodes([
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
    clash.getClashNodes([
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
    clash.getClashNodes([
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
