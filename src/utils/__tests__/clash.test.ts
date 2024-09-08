import test from 'ava'

import { NodeTypeEnum, PossibleNodeConfigType } from '../../types'
import * as clash from '../clash'

test('getClashNodeNames', async (t) => {
  const nodeNameList: ReadonlyArray<PossibleNodeConfigType> = [
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
  ]
  const result1 = clash.getClashNodeNames(nodeNameList)
  const result2 = clash.getClashNodeNames(nodeNameList, undefined, ['TEST'])
  const result3 = clash.getClashNodeNames(
    nodeNameList,
    (nodeConfig) => nodeConfig.nodeName !== 'Test Node 3',
  )
  const result4 = clash.getClashNodeNames(
    nodeNameList,
    (nodeConfig) => nodeConfig.nodeName === 'Test Node 4',
    [],
    ['DIRECT'],
  )
  t.deepEqual(result1, ['Test Node 1', 'Test Node 3'])
  t.deepEqual(result2, ['TEST', 'Test Node 1', 'Test Node 3'])
  t.deepEqual(result3, ['Test Node 1'])
  t.deepEqual(result4, ['DIRECT'])

  t.deepEqual(
    clash.getClashNodeNames([
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
  )
})

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
      obfsHost: 'example.com',
      udpRelay: true,
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
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: 'Test Node 3',
      port: 8080,
      tls: false,
      skipCertVerify: true,
      type: NodeTypeEnum.Vmess,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      wsOpts: {
        headers: {
          host: 'example.com',
        },
        path: '/',
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
  ]
  const array = clash.getClashNodes(nodeList)

  t.is(array.length, nodeList.length)
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
  })
  t.deepEqual(array[1], {
    name: 'Test Node 2',
    type: 'ss',
    server: 'example2.com',
    port: '443',
    cipher: 'chacha20-ietf-poly1305',
    password: 'password',
    udp: false,
  })
  t.deepEqual(array[2], {
    cipher: 'auto',
    name: 'Test Node 3',
    alterId: '64',
    server: '1.1.1.1',
    network: 'ws',
    port: 8080,
    udp: false,
    type: 'vmess',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    'ws-opts': {
      headers: {
        host: 'example.com',
      },
      path: '/',
    },
  })
  t.deepEqual(array[3], {
    cipher: 'auto',
    name: 'Test Node 4',
    alterId: '64',
    network: 'tcp',
    server: '1.1.1.1',
    port: 8080,
    type: 'vmess',
    udp: false,
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  })
  t.deepEqual(array[4], {
    cipher: 'auto',
    name: 'Test Node 5',
    alterId: '64',
    network: 'tcp',
    server: '1.1.1.1',
    port: 8080,
    tls: true,
    type: 'vmess',
    udp: false,
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  })
  t.deepEqual(array[5], {
    cipher: 'auto',
    name: 'Test Node 6',
    alterId: '64',
    server: '1.1.1.1',
    network: 'tcp',
    port: 8080,
    tls: true,
    udp: false,
    type: 'vmess',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  })
  t.deepEqual(array[6], {
    cipher: 'auto',
    name: 'Test Node 7',
    alterId: '64',
    server: '1.1.1.1',
    network: 'tcp',
    port: 8080,
    tls: true,
    udp: false,
    'skip-cert-verify': true,
    type: 'vmess',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  })

  t.deepEqual(
    clash.getClashNodes([
      {
        nodeName: 'Test Node 1',
        type: NodeTypeEnum.Shadowsocks,
        hostname: 'example.com',
        port: '443',
        method: 'chacha20-ietf-poly1305',
        password: 'password',
        udpRelay: true,
        shadowTls: {
          password: 'password',
          sni: 'example.com',
          version: 3,
        },
      },
      {
        nodeName: 'Test Node 1',
        type: NodeTypeEnum.Shadowsocks,
        hostname: 'example.com',
        port: '443',
        method: 'chacha20-ietf-poly1305',
        password: 'password',
        udpRelay: true,
        shadowTls: {
          password: 'password',
          sni: 'example.com',
          version: 3,
        },
        clashConfig: {
          enableTuic: false,
          enableShadowTls: true,
        },
      },
      {
        nodeName: 'Test Node 1',
        type: NodeTypeEnum.Shadowsocks,
        hostname: 'example.com',
        port: '443',
        method: 'chacha20-ietf-poly1305',
        password: 'password',
        udpRelay: true,
        obfs: 'tls',
        obfsHost: 'example.com',
        shadowTls: {
          password: 'password',
          sni: 'example.com',
          version: 3,
        },
        clashConfig: {
          enableTuic: false,
          enableShadowTls: true,
        },
      },
    ]),
    [
      {
        cipher: 'chacha20-ietf-poly1305',
        'client-fingerprint': 'chrome',
        name: 'Test Node 1',
        password: 'password',
        plugin: 'shadow-tls',
        'plugin-opts': {
          host: 'example.com',
          password: 'password',
          version: 3,
        },
        port: '443',
        server: 'example.com',
        type: 'ss',
        udp: true,
      },
    ],
  )

  t.deepEqual(
    clash.getClashNodes([
      {
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: 'Test',
        port: 8080,
        tls: true,
        udpRelay: true,
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
        network: 'tcp',
        'skip-cert-verify': true,
        tls: true,
        type: 'vmess',
        udp: true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
    ],
  )

  t.deepEqual(
    clash.getClashNodes([
      {
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'grpc',
        nodeName: 'Test Node 3',
        port: 8080,
        tls: false,
        skipCertVerify: true,
        type: NodeTypeEnum.Vmess,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        grpcOpts: {
          serviceName: 'test',
        },
      },
    ]),
    [
      {
        alterId: '64',
        cipher: 'auto',
        name: 'Test Node 3',
        network: 'grpc',
        port: 8080,
        server: '1.1.1.1',
        type: 'vmess',
        udp: false,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        'grpc-opts': {
          'grpc-service-name': 'test',
        },
      },
    ],
  )

  t.deepEqual(
    clash.getClashNodes([
      {
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'http',
        nodeName: 'Test Node 3',
        port: 8080,
        tls: false,
        skipCertVerify: true,
        type: NodeTypeEnum.Vmess,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        httpOpts: {
          headers: {
            host: 'example.com',
          },
          method: 'GET',
          path: ['/'],
        },
      },
    ]),
    [
      {
        alterId: '64',
        cipher: 'auto',
        name: 'Test Node 3',
        network: 'http',
        port: 8080,
        server: '1.1.1.1',
        type: 'vmess',
        udp: false,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        'http-opts': {
          headers: {
            host: ['example.com'],
          },
          method: 'GET',
          path: ['/'],
        },
      },
    ],
  )

  t.deepEqual(
    clash.getClashNodes([
      {
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'h2',
        nodeName: 'Test Node 3',
        port: 8080,
        tls: false,
        skipCertVerify: true,
        type: NodeTypeEnum.Vmess,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        h2Opts: {
          path: '/h2',
          host: ['host.com', 'example.com'],
        },
      },
    ]),
    [
      {
        alterId: '64',
        cipher: 'auto',
        name: 'Test Node 3',
        network: 'h2',
        port: 8080,
        server: '1.1.1.1',
        type: 'vmess',
        udp: false,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        'h2-opts': {
          path: '/h2',
          host: ['host.com', 'example.com'],
        },
      },
    ],
  )

  t.deepEqual(
    clash.getClashNodes([
      {
        type: NodeTypeEnum.Vless,
        nodeName: 'vless',
        hostname: 'server',
        port: 443,
        uuid: 'uuid',
        method: 'none',
        network: 'h2',
        udpRelay: true,
        flow: 'xtls-rprx-direct',
        h2Opts: {
          path: '/path',
          host: ['v2ray.com'],
        },
        realityOpts: {
          publicKey: 'publicKey',
          shortId: 'shortId',
        },
        clashConfig: {
          enableVless: true,
        },
      },
    ]),
    [
      {
        type: 'vless',
        name: 'vless',
        server: 'server',
        port: 443,
        uuid: 'uuid',
        cipher: 'none',
        flow: 'xtls-rprx-direct',
        udp: true,
        tls: true,
        network: 'h2',
        'h2-opts': {
          path: '/path',
          host: ['v2ray.com'],
        },
        'reality-opts': {
          'public-key': 'publicKey',
          'short-id': 'shortId',
        },
      },
    ],
  )

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
  )
  t.deepEqual(
    clash.getClashNodes([
      {
        nodeName: 'snell',
        type: NodeTypeEnum.Snell,
        hostname: '1.1.1.1',
        port: 443,
        psk: 'psk',
        obfs: 'tls',
        obfsHost: 'example.com',
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
  )
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
  )

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
  )
  t.deepEqual(
    clash.getClashNodes([
      {
        nodeName: 'trojan',
        type: NodeTypeEnum.Trojan,
        hostname: '1.1.1.1',
        port: 443,
        password: 'password1',
        udpRelay: true,
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
  )
  t.deepEqual(
    clash.getClashNodes([
      {
        nodeName: 'trojan',
        type: NodeTypeEnum.Trojan,
        hostname: '1.1.1.1',
        port: 443,
        password: 'password1',
        udpRelay: true,
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
  )
  t.deepEqual(
    clash.getClashNodes([
      {
        nodeName: 'trojan',
        type: NodeTypeEnum.Trojan,
        hostname: '1.1.1.1',
        port: 443,
        password: 'password1',
        udpRelay: true,
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
  )

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
  )

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
  )

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
  )

  t.deepEqual(
    clash.getClashNodes([
      {
        nodeName: 'tuic',
        type: NodeTypeEnum.Tuic,
        hostname: '1.1.1.1',
        port: 443,
        token: 'password',
      },
    ]),
    [],
  )

  t.deepEqual(
    clash.getClashNodes([
      {
        nodeName: 'tuic',
        type: NodeTypeEnum.Tuic,
        clashConfig: {
          enableTuic: true,
          enableShadowTls: false,
        },
        hostname: '1.1.1.1',
        port: 443,
        token: 'password',
      },
      {
        nodeName: 'tuic',
        type: NodeTypeEnum.Tuic,
        clashConfig: {
          enableTuic: true,
          enableShadowTls: false,
          clashCore: 'stash',
        },
        hostname: '1.1.1.1',
        port: 443,
        token: 'password',
        skipCertVerify: true,
        alpn: ['h3'],
        portHopping: '5000-6000',
        portHoppingInterval: 10,
      },
    ]),
    [
      {
        type: 'tuic',
        name: 'tuic',
        server: '1.1.1.1',
        port: 443,
        token: 'password',
        udp: true,
      },
      {
        type: 'tuic',
        name: 'tuic',
        server: '1.1.1.1',
        port: 443,
        token: 'password',
        'skip-cert-verify': true,
        udp: true,
        alpn: ['h3'],
        'hop-interval': 10,
        ports: '5000-6000',
      },
    ],
  )

  t.deepEqual(
    clash.getClashNodes([
      {
        nodeName: 'wireguard',
        type: NodeTypeEnum.Wireguard,
        privateKey: 'privateKey',
        selfIp: '127.0.0.1',
        peers: [
          {
            endpoint: 'example.com:1234',
            publicKey: 'publicKey',
            reservedBits: [1, 2, 3],
          },
        ],
      },
      {
        nodeName: 'wireguard',
        type: NodeTypeEnum.Wireguard,
        privateKey: 'privateKey',
        selfIp: '127.0.0.1',
        peers: [
          {
            endpoint: 'example.com:1234',
            publicKey: 'publicKey',
            reservedBits: [1, 2, 3],
          },
          {
            endpoint: 'example.com:1235',
            publicKey: 'publicKey',
            reservedBits: [1, 2, 3],
          },
        ],
      },
    ]),
    [
      {
        ip: '127.0.0.1',
        name: 'wireguard',
        port: 1234,
        'private-key': 'privateKey',
        'public-key': 'publicKey',
        server: 'example.com',
        type: 'wireguard',
        udp: true,
        reserved: [1, 2, 3],
      },
      {
        ip: '127.0.0.1',
        name: 'wireguard',
        port: 1234,
        'private-key': 'privateKey',
        'public-key': 'publicKey',
        server: 'example.com',
        type: 'wireguard',
        udp: true,
        reserved: [1, 2, 3],
      },
    ],
  )

  t.deepEqual(
    clash.getClashNodes([
      {
        type: NodeTypeEnum.Hysteria2,
        nodeName: '测试 Hysteria2',
        hostname: 'example.com',
        port: 443,
        password: 'password',
        downloadBandwidth: 100,
        uploadBandwidth: 100,
        clashConfig: {
          enableHysteria2: true,
        },
      },
      {
        type: NodeTypeEnum.Hysteria2,
        nodeName: '测试 Hysteria2',
        hostname: 'example.com',
        port: 443,
        password: 'password',
        downloadBandwidth: 100,
        uploadBandwidth: 100,
        portHopping: '5000-6000',
        portHoppingInterval: 10,
        clashConfig: {
          enableHysteria2: true,
          clashCore: 'stash',
        },
      },
      {
        type: NodeTypeEnum.Hysteria2,
        nodeName: '测试 Hysteria2',
        hostname: 'example.com',
        port: 443,
        password: 'password',
        downloadBandwidth: 100,
        uploadBandwidth: 100,
        ecn: true,
        sni: 'sni.example.com',
        skipCertVerify: true,
        clashConfig: {
          enableHysteria2: true,
        },
      },
    ]),
    [
      {
        down: 100,
        name: '测试 Hysteria2',
        password: 'password',
        port: 443,
        server: 'example.com',
        type: 'hysteria2',
        up: 100,
      },
      {
        down: 100,
        name: '测试 Hysteria2',
        auth: 'password',
        port: 443,
        server: 'example.com',
        type: 'hysteria2',
        up: 100,
        ports: '5000-6000',
        'hop-interval': 10,
      },
      {
        down: 100,
        name: '测试 Hysteria2',
        password: 'password',
        port: 443,
        server: 'example.com',
        'skip-cert-verify': true,
        sni: 'sni.example.com',
        type: 'hysteria2',
        up: 100,
      },
    ],
  )

  t.deepEqual(
    clash.getClashNodes([
      {
        nodeName: 'trojan',
        type: NodeTypeEnum.Trojan,
        hostname: '1.1.1.1',
        port: 443,
        password: 'password1',
        udpRelay: true,
        alpn: ['h2', 'http/1.1'],
        sni: 'example.com',
        skipCertVerify: true,
        network: 'ws',
        underlyingProxy: 'socks5',
        multiplex: {
          protocol: 'smux',
          maxConnections: 10,
          minStreams: 1,
          maxStreams: 16,
          padding: true,
          brutal: {
            upMbps: 100,
            downMbps: 100,
          },
        },
        clashConfig: {
          clashCore: 'clash.meta',
        },
      },
    ]),
    [
      {
        alpn: ['h2', 'http/1.1'],
        'dialer-proxy': 'socks5',
        name: 'trojan',
        network: 'ws',
        password: 'password1',
        port: 443,
        server: '1.1.1.1',
        'skip-cert-verify': true,
        smux: {
          'brutal-opts': {
            down: 100,
            enabled: true,
            up: 100,
          },
          enabled: true,
          'max-connections': 10,
          'max-streams': 16,
          'min-streams': 1,
          padding: true,
          protocol: 'smux',
        },
        sni: 'example.com',
        type: 'trojan',
        udp: true,
        'ws-opts': {
          path: '/',
        },
      },
    ],
  )
})
