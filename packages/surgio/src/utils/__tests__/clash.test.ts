import { expect, test, vi } from 'vitest'

import { NodeTypeEnum, PossibleNodeConfigType } from '../../types.js'
import * as clash from '../clash.js'

test('getClashNodeNames', async () => {
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
  expect(result1).toEqual(['Test Node 1', 'Test Node 3'])
  expect(result2).toEqual(['TEST', 'Test Node 1', 'Test Node 3'])
  expect(result3).toEqual(['Test Node 1'])
  expect(result4).toEqual(['DIRECT'])

  expect(
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
  ).toEqual([])
})

test('getClashNodes', async () => {
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

  expect(array.length).toBe(nodeList.length)
  expect(array[0]).toEqual({
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
  expect(array[1]).toEqual({
    name: 'Test Node 2',
    type: 'ss',
    server: 'example2.com',
    port: '443',
    cipher: 'chacha20-ietf-poly1305',
    password: 'password',
    udp: false,
  })
  expect(array[2]).toEqual({
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
  expect(array[3]).toEqual({
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
  expect(array[4]).toEqual({
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
  expect(array[5]).toEqual({
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
  expect(array[6]).toEqual({
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

  expect(
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
        clashConfig: { clashCore: 'clash' },
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
      },
    ]),
  ).toEqual([
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
  ])

  expect(
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
  ).toEqual([
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
  ])

  expect(
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
  ).toEqual([
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
  ])
  expect(
    clash.getClashNodes([
      {
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: 'Test Meta VMess ALPN',
        port: 8080,
        tls: true,
        alpn: ['h2', 'http/1.1'],
        type: NodeTypeEnum.Vmess,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        clashConfig: {
          clashCore: 'clash.meta',
        },
      },
      {
        type: NodeTypeEnum.Vless,
        nodeName: 'Test Meta VLESS ALPN',
        hostname: 'server',
        port: 443,
        uuid: 'uuid',
        method: 'none',
        network: 'tcp',
        alpn: ['h2'],
        encryption: 'none',
        clashConfig: {
          clashCore: 'clash.meta',
        },
      },
      {
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: 'Test Non Meta VMess ALPN',
        port: 8080,
        alpn: ['h2'],
        type: NodeTypeEnum.Vmess,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
      {
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: 'Test Meta VMess No ALPN',
        port: 8080,
        tls: true,
        type: NodeTypeEnum.Vmess,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        clashConfig: {
          clashCore: 'clash.meta',
        },
      },
    ]),
  ).toEqual([
    {
      alterId: '64',
      cipher: 'auto',
      name: 'Test Meta VMess ALPN',
      network: 'tcp',
      server: '1.1.1.1',
      port: 8080,
      tls: true,
      alpn: ['h2', 'http/1.1'],
      type: 'vmess',
      udp: false,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    },
    {
      type: 'vless',
      name: 'Test Meta VLESS ALPN',
      server: 'server',
      port: 443,
      uuid: 'uuid',
      cipher: 'none',
      udp: false,
      network: 'tcp',
      alpn: ['h2'],
      encryption: 'none',
      tls: true,
    },
    {
      alterId: '64',
      cipher: 'auto',
      name: 'Test Non Meta VMess ALPN',
      network: 'tcp',
      server: '1.1.1.1',
      port: 8080,
      type: 'vmess',
      udp: false,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    },
    {
      alterId: '64',
      cipher: 'auto',
      name: 'Test Meta VMess No ALPN',
      network: 'tcp',
      server: '1.1.1.1',
      port: 8080,
      tls: true,
      type: 'vmess',
      udp: false,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    },
  ])

  expect(
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
  ).toEqual([
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
  ])

  expect(
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
  ).toEqual([
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
  ])

  expect(
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
        encryption: 'encryption',
      },
    ]),
  ).toEqual([
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
      encryption: 'encryption',
      'reality-opts': {
        'public-key': 'publicKey',
        'short-id': 'shortId',
      },
    },
  ])

  expect(
    clash.getClashNodes([
      {
        type: NodeTypeEnum.Vless,
        nodeName: 'vless-xhttp',
        hostname: 'server',
        port: 443,
        uuid: 'uuid',
        method: 'none',
        network: 'xhttp',
        udpRelay: true,
        flow: 'xtls-rprx-vision',
        encryption: 'none',
        packetEncoding: 'xudp',
        xhttpOpts: {
          path: '/xhttp',
          mode: 'auto',
        },
        echOpts: {
          enable: true,
          config: 'ech-config',
        },
      },
    ]),
  ).toEqual([
    {
      type: 'vless',
      name: 'vless-xhttp',
      server: 'server',
      port: 443,
      uuid: 'uuid',
      cipher: 'none',
      flow: 'xtls-rprx-vision',
      udp: true,
      tls: true,
      network: 'xhttp',
      encryption: 'none',
      'packet-encoding': 'xudp',
      'xhttp-opts': {
        path: '/xhttp',
        mode: 'auto',
      },
      'ech-opts': {
        enable: true,
        config: 'ech-config',
      },
    },
  ])

  expect(
    clash.getClashNodes([
      {
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'xhttp',
        nodeName: 'vmess-xhttp',
        port: 8080,
        type: NodeTypeEnum.Vmess,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      } as any,
    ]),
  ).toEqual([])

  expect(
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
  ).toEqual([
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
  ])
  expect(
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
  ).toEqual([
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
  ])
  expect(
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
  ).toEqual([])

  expect(
    clash.getClashNodes([
      {
        type: NodeTypeEnum.AnyTLS,
        nodeName: 'anytls',
        hostname: 'example.com',
        port: 443,
        password: 'password',
        udpRelay: false,
        skipCertVerify: false,
        idleSessionCheckInterval: 0,
        idleSessionTimeout: 0,
        minIdleSessions: 0,
      },
    ]),
  ).toEqual([
    {
      type: 'anytls',
      name: 'anytls',
      server: 'example.com',
      port: 443,
      password: 'password',
      udp: false,
      'skip-cert-verify': false,
      'idle-session-check-interval': 0,
      'idle-session-timeout': 0,
      'min-idle-session': 0,
    },
  ])

  expect(
    clash.getClashNodes([
      {
        nodeName: 'trojan',
        type: NodeTypeEnum.Trojan,
        hostname: '1.1.1.1',
        port: 443,
        password: 'password1',
      },
    ]),
  ).toEqual([
    {
      name: 'trojan',
      type: 'trojan',
      server: '1.1.1.1',
      port: 443,
      password: 'password1',
      'skip-cert-verify': false,
    },
  ])
  expect(
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
  ).toEqual([
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
  ])
  expect(
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
  ).toEqual([
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
  ])
  expect(
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
  ).toEqual([
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
  ])

  expect(
    clash.getClashNodes([
      {
        nodeName: 'socks5',
        type: NodeTypeEnum.Socks5,
        hostname: '1.1.1.1',
        port: 443,
      },
    ]),
  ).toEqual([
    {
      type: 'socks5',
      name: 'socks5',
      server: '1.1.1.1',
      port: 443,
    },
  ])

  expect(
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
  ).toEqual([
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
  ])

  expect(
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
  ).toEqual([
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
  ])

  expect(
    clash.getClashNodes([
      {
        nodeName: 'tuic',
        type: NodeTypeEnum.Tuic,
        hostname: '1.1.1.1',
        port: 443,
        token: 'password',
        clashConfig: { clashCore: 'clash' },
      },
    ]),
  ).toEqual([])

  expect(
    clash.getClashNodes([
      {
        nodeName: 'tuic',
        type: NodeTypeEnum.Tuic,
        hostname: '1.1.1.1',
        port: 443,
        token: 'password',
        congestionControl: 'bbr',
      },
      {
        nodeName: 'tuic',
        type: NodeTypeEnum.Tuic,
        clashConfig: {
          clashCore: 'stash',
        },
        hostname: '1.1.1.1',
        port: 443,
        token: 'password',
        skipCertVerify: true,
        alpn: ['h3'],
        portHopping: '5000-6000;7000',
        portHoppingInterval: 10,
      },
    ]),
  ).toEqual([
    {
      type: 'tuic',
      name: 'tuic',
      server: '1.1.1.1',
      port: 443,
      token: 'password',
      udp: true,
      'congestion-controller': 'bbr',
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
      ports: '5000-6000,7000',
    },
  ])

  expect(
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
  ).toEqual([
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
  ])

  expect(
    clash.getClashNodes([
      {
        type: NodeTypeEnum.Hysteria2,
        nodeName: '测试 Hysteria2',
        hostname: 'example.com',
        port: 443,
        password: 'password',
        downloadBandwidth: 100,
        uploadBandwidth: 100,
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
      },
    ]),
  ).toEqual([
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
  ])

  expect(
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
  ).toEqual([
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
  ])
})

test('getClashNodes - MASQUE varies by clashCore and auth mode', () => {
  const keyPairNode = {
    type: NodeTypeEnum.Masque as const,
    authMode: 'key-pair' as const,
    nodeName: 'WARP MASQUE',
    hostname: 'masque.example.com',
    port: 443,
    privateKey: 'private-key',
    publicKey: 'public-key',
    ip: '172.16.0.2/32',
    ipv6: 'fd00::2/128',
    dnsServers: ['1.1.1.1', '2606:4700:4700::1111'] as [string, string],
    network: 'h3' as const,
    sni: 'consumer-masque.cloudflareclient.com',
    connectUri: 'https://cloudflareaccess.com',
    mtu: 1280,
    keepalive: 30,
    udpRelay: true,
    remoteDnsResolve: true,
    congestionController: 'bbr' as const,
    bbrProfile: 'aggressive' as const,
    handshakeTimeout: 20,
    underlyingProxy: 'upstream',
  }

  expect(
    clash.getClashNodes([
      {
        ...keyPairNode,
        clashConfig: { clashCore: 'stash' },
      },
      {
        ...keyPairNode,
        clashConfig: { clashCore: 'clash.meta' },
      },
    ]),
  ).toEqual([
    {
      type: 'masque',
      name: 'WARP MASQUE',
      server: 'masque.example.com',
      port: 443,
      'private-key': 'private-key',
      'public-key': 'public-key',
      ip: '172.16.0.2/32',
      ipv6: 'fd00::2/128',
      sni: 'consumer-masque.cloudflareclient.com',
      mtu: 1280,
      dns: ['1.1.1.1', '2606:4700:4700::1111'],
      network: 'h3',
      'connect-uri': 'https://cloudflareaccess.com',
      keepalive: 30,
    },
    {
      type: 'masque',
      name: 'WARP MASQUE',
      server: 'masque.example.com',
      port: 443,
      'private-key': 'private-key',
      'public-key': 'public-key',
      ip: '172.16.0.2/32',
      ipv6: 'fd00::2/128',
      sni: 'consumer-masque.cloudflareclient.com',
      mtu: 1280,
      dns: ['1.1.1.1', '2606:4700:4700::1111'],
      network: 'quic',
      udp: true,
      'remote-dns-resolve': true,
      'congestion-controller': 'bbr',
      'bbr-profile': 'aggressive',
      'handshake-timeout': 20,
      'dialer-proxy': 'upstream',
    },
  ])

  expect(
    clash.getClashNodes([
      {
        type: NodeTypeEnum.Masque,
        authMode: 'basic-auth',
        nodeName: 'Surge MASQUE',
        hostname: 'masque.example.com',
        port: 443,
        clashConfig: { clashCore: 'clash.meta' },
      },
      {
        ...keyPairNode,
        clashConfig: { clashCore: 'clash' },
      },
      {
        type: NodeTypeEnum.Masque,
        authMode: 'key-pair',
        nodeName: 'H3 L4 MASQUE',
        hostname: 'masque.example.com',
        port: 443,
        privateKey: 'private-key',
        publicKey: 'public-key',
        network: 'h3-l4proxy',
        udpRelay: false,
        clashConfig: { clashCore: 'stash' },
      },
    ]),
  ).toEqual([])
})

test('getClashNodes - TrustTunnel varies by clashCore', () => {
  const sharedNode = {
    type: NodeTypeEnum.TrustTunnel as const,
    nodeName: 'TrustTunnel',
    hostname: 'trust.example.com',
    port: 443,
    username: 'user',
    password: 'pass',
    quic: true,
    alpn: ['h3'] as [string],
    sni: 'sni.example.com',
    skipCertVerify: true,
    serverCertFingerprintSha256: 'sha256',
    underlyingProxy: 'upstream',
  }

  expect(
    clash.getClashNodes([
      {
        ...sharedNode,
        portHopping: '443;8443;5000-6000',
        portHoppingInterval: 30,
        clashConfig: { clashCore: 'stash' },
      },
      {
        ...sharedNode,
        udpRelay: true,
        clientFingerprint: 'chrome',
        healthCheck: true,
        nameCertVerify: 'verify.example.com',
        congestionController: 'bbr',
        bbrProfile: 'conservative' as const,
        maxConnections: 8,
        minStreams: 5,
        clashConfig: { clashCore: 'clash.meta' },
      },
    ]),
  ).toEqual([
    {
      type: 'trusttunnel',
      name: 'TrustTunnel',
      server: 'trust.example.com',
      port: 443,
      username: 'user',
      password: 'pass',
      quic: true,
      sni: 'sni.example.com',
      alpn: ['h3'],
      'skip-cert-verify': true,
      'server-cert-fingerprint': 'sha256',
      'dialer-proxy': 'upstream',
      ports: '443,8443,5000-6000',
      'hop-interval': 30,
    },
    {
      type: 'trusttunnel',
      name: 'TrustTunnel',
      server: 'trust.example.com',
      port: 443,
      username: 'user',
      password: 'pass',
      quic: true,
      sni: 'sni.example.com',
      alpn: ['h3'],
      'skip-cert-verify': true,
      fingerprint: 'sha256',
      'client-fingerprint': 'chrome',
      udp: true,
      'health-check': true,
      'name-cert-verify': 'verify.example.com',
      'congestion-controller': 'bbr',
      'bbr-profile': 'conservative',
      'max-connections': 8,
      'min-streams': 5,
      'dialer-proxy': 'upstream',
    },
  ])

  expect(
    clash.getClashNodes([
      {
        ...sharedNode,
        clashConfig: { clashCore: 'clash' },
      },
      {
        ...sharedNode,
        shadowTls: {
          password: 'shadow-password',
          sni: 'shadow.example.com',
        },
        clashConfig: { clashCore: 'stash' },
      },
      {
        ...sharedNode,
        shadowTls: {
          password: 'shadow-password',
          sni: 'shadow.example.com',
        },
        clashConfig: { clashCore: 'clash.meta' },
      },
      {
        ...sharedNode,
        interfaceName: 'en0',
        clashConfig: { clashCore: 'stash' },
      },
      {
        ...sharedNode,
        portHopping: '443;8443',
        clashConfig: { clashCore: 'clash.meta' },
      },
    ]),
  ).toEqual([])
})

test('getClashNodes - Tailscale varies by clashCore', () => {
  const tailscaleNode = {
    type: NodeTypeEnum.Tailscale as const,
    nodeName: 'tailnet',
    authKey: 'tskey-auth-example',
    hostname: 'surgio-node',
    controlUrl: 'https://controlplane.tailscale.com',
    exitNode: '100.64.0.1',
    ephemeral: false,
    stateDir: './tailscale',
    udpRelay: false,
    acceptRoutes: true,
    exitNodeAllowLanAccess: false,
    routingMark: 0,
    underlyingProxy: 'upstream',
    interfaceName: 'WLAN',
    ipVersion: 'ipv4-prefer' as const,
    tfo: true,
  }

  expect(clash.getClashNodes([tailscaleNode])).toEqual(
    clash.getClashNodes([
      {
        ...tailscaleNode,
        clashConfig: { clashCore: 'clash.meta' },
      },
    ]),
  )

  expect(
    clash.getClashNodes([
      {
        ...tailscaleNode,
        clashConfig: { clashCore: 'stash' },
      },
    ]),
  ).toEqual([
    {
      type: 'tailscale',
      name: 'tailnet',
      'auth-key': 'tskey-auth-example',
      hostname: 'surgio-node',
      'control-url': 'https://controlplane.tailscale.com',
      ephemeral: false,
      'exit-node': '100.64.0.1',
    },
  ])

  expect(
    clash.getClashNodes([
      {
        ...tailscaleNode,
        clashConfig: { clashCore: 'clash.meta' },
      },
    ]),
  ).toEqual([
    {
      type: 'tailscale',
      name: 'tailnet',
      'auth-key': 'tskey-auth-example',
      hostname: 'surgio-node',
      'control-url': 'https://controlplane.tailscale.com',
      'state-dir': './tailscale',
      ephemeral: false,
      udp: false,
      'accept-routes': true,
      'exit-node': '100.64.0.1',
      'exit-node-allow-lan-access': false,
      'dialer-proxy': 'upstream',
      'interface-name': 'WLAN',
      'routing-mark': 0,
      'ip-version': 'ipv4-prefer',
    },
  ])

  expect(
    clash.getClashNodes([
      {
        ...tailscaleNode,
        clashConfig: { clashCore: 'clash' },
      },
    ]),
  ).toEqual([])
})

test('getClashNodes - HTTP/HTTPS with headers', async () => {
  expect(
    clash.getClashNodes([
      {
        type: NodeTypeEnum.HTTP,
        nodeName: 'HTTP Proxy',
        hostname: '1.1.1.1',
        port: 8080,
        username: 'user',
        password: 'pass',
        headers: {
          'X-Custom': 'value',
          Host: 'example.com',
        },
      },
    ]),
  ).toEqual([
    {
      type: 'http',
      name: 'HTTP Proxy',
      server: '1.1.1.1',
      port: 8080,
      username: 'user',
      password: 'pass',
      headers: {
        'X-Custom': 'value',
        Host: 'example.com',
      },
    },
  ])

  expect(
    clash.getClashNodes([
      {
        type: NodeTypeEnum.HTTP,
        nodeName: 'HTTP Proxy No Headers',
        hostname: '1.1.1.1',
        port: 8080,
        username: 'user',
        password: 'pass',
      },
    ]),
  ).toEqual([
    {
      type: 'http',
      name: 'HTTP Proxy No Headers',
      server: '1.1.1.1',
      port: 8080,
      username: 'user',
      password: 'pass',
    },
  ])

  expect(
    clash.getClashNodes([
      {
        type: NodeTypeEnum.HTTPS,
        nodeName: 'HTTPS Proxy',
        hostname: '1.1.1.1',
        port: 443,
        username: 'user',
        password: 'pass',
        tls13: false,
        skipCertVerify: false,
        headers: {
          'X-Custom': 'value',
        },
      },
    ]),
  ).toEqual([
    {
      type: 'http',
      name: 'HTTPS Proxy',
      server: '1.1.1.1',
      port: 443,
      username: 'user',
      password: 'pass',
      tls: true,
      'skip-cert-verify': false,
      headers: {
        'X-Custom': 'value',
      },
    },
  ])

  expect(
    clash.getClashNodes([
      {
        type: NodeTypeEnum.HTTP,
        nodeName: 'HTTP No Auth',
        hostname: '1.1.1.1',
        port: 8080,
      },
    ]),
  ).toEqual([
    {
      type: 'http',
      name: 'HTTP No Auth',
      server: '1.1.1.1',
      port: 8080,
    },
  ])
})

test('getClashNodes maps Surge ipVersion values for Mihomo', () => {
  expect(
    clash.getClashNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'Socks5 Node',
        hostname: 'example.com',
        port: 1080,
        ipVersion: 'prefer-v4',
        clashConfig: { clashCore: 'clash.meta' },
      },
    ]),
  ).toEqual([
    {
      type: 'socks5',
      name: 'Socks5 Node',
      server: 'example.com',
      port: 1080,
      'ip-version': 'ipv4-prefer',
    },
  ])
})

test('getClashNodes omits unknown ipVersion values for Mihomo', () => {
  const warn = vi.fn()
  const logger = { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() }

  expect(
    clash.getClashNodes(
      [
        {
          type: NodeTypeEnum.Socks5,
          nodeName: 'Socks5 Node',
          hostname: 'example.com',
          port: 1080,
          ipVersion: 'constructor',
          clashConfig: { clashCore: 'clash.meta' },
        },
      ],
      undefined,
      { logger },
    ),
  ).toEqual([
    {
      type: 'socks5',
      name: 'Socks5 Node',
      server: 'example.com',
      port: 1080,
    },
  ])
  expect(warn).toHaveBeenCalledWith(
    'Mihomo 不支持 ipVersion=constructor，节点 Socks5 Node 将不包含此字段',
  )
})

test('getClashNodes outputs every protocol for Mihomo and Stash without extra switches', () => {
  const nodeList: PossibleNodeConfigType[] = [
    {
      type: NodeTypeEnum.Vless,
      nodeName: 'vless',
      hostname: 'example.com',
      port: 443,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      method: 'none',
      network: 'tcp',
    },
    {
      type: NodeTypeEnum.Tuic,
      nodeName: 'tuic',
      hostname: 'example.com',
      port: 443,
      token: 'token',
    },
    {
      type: NodeTypeEnum.Hysteria2,
      nodeName: 'hysteria2',
      hostname: 'example.com',
      port: 443,
      password: 'password',
    },
    {
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'shadow-tls',
      hostname: 'example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      shadowTls: { password: 'password', sni: 'example.com' },
    },
  ]

  for (const clashCore of [undefined, 'clash.meta', 'stash'] as const) {
    expect(
      clash
        .getClashNodeNames(
          nodeList.map((node) => ({ ...node, clashConfig: { clashCore } })),
        )
        .slice(),
    ).toEqual(['vless', 'tuic', 'hysteria2', 'shadow-tls'])
  }
})

test('getClashNodes omits nodes that original Clash does not support', () => {
  const warn = vi.fn()
  const logger = { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() }
  const clashConfig = { clashCore: 'clash' } as const
  const nodeList: PossibleNodeConfigType[] = [
    {
      type: NodeTypeEnum.Vless,
      nodeName: 'vless',
      hostname: 'example.com',
      port: 443,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      method: 'none',
      network: 'tcp',
      clashConfig,
    },
    {
      type: NodeTypeEnum.Tuic,
      nodeName: 'tuic',
      hostname: 'example.com',
      port: 443,
      token: 'token',
      clashConfig,
    },
    {
      type: NodeTypeEnum.Hysteria2,
      nodeName: 'hysteria2',
      hostname: 'example.com',
      port: 443,
      password: 'password',
      clashConfig,
    },
    {
      type: NodeTypeEnum.AnyTLS,
      nodeName: 'anytls',
      hostname: 'example.com',
      port: 443,
      password: 'password',
      clashConfig,
    },
    {
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'shadow-tls',
      hostname: 'example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      shadowTls: { password: 'password', sni: 'example.com' },
      clashConfig,
    },
    {
      type: NodeTypeEnum.Trojan,
      nodeName: 'trojan',
      hostname: 'example.com',
      port: 443,
      password: 'password',
      clashConfig,
    },
  ]

  expect(
    clash
      .getClashNodes(nodeList, undefined, { logger })
      .map((node) => node.name),
  ).toEqual(['trojan'])
  expect(warn.mock.calls.map(([message]) => message)).toEqual(
    ['vless', 'tuic', 'hysteria2', 'anytls', 'shadow-tls'].map((name) =>
      expect.stringMatching(new RegExp(`原版 Clash.*节点 ${name} 会被省略`)),
    ),
  )
})

const createWarnLogger = () => {
  const warn = vi.fn()
  return {
    warn,
    logger: { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() },
  }
}

const snellV6Node = {
  nodeName: 'snell-v6',
  type: NodeTypeEnum.Snell,
  hostname: '1.1.1.1',
  port: 443,
  psk: 'psk-with-12-bytes',
  version: 6,
} as const

test('getClashNodes outputs Snell v6 for Mihomo when enableSnellV6 is set', () => {
  const { logger, warn } = createWarnLogger()

  expect(
    clash.getClashNodes(
      [
        {
          ...snellV6Node,
          obfs: 'http',
          obfsHost: 'example.com',
          mode: 'unshaped',
          reuse: true,
          udpRelay: true,
          clashConfig: { clashCore: 'clash.meta', enableSnellV6: true },
        },
      ],
      undefined,
      { logger },
    ),
  ).toEqual([
    {
      name: 'snell-v6',
      type: 'snell',
      server: '1.1.1.1',
      port: 443,
      psk: 'psk-with-12-bytes',
      version: 6,
      mode: 'unshaped',
      reuse: true,
      udp: true,
    },
  ])
  expect(warn).toHaveBeenCalledWith(
    'snell v6 不支持混淆，节点 snell-v6 将忽略 obfs',
  )
})

test('getClashNodes omits Snell v6 that Mihomo cannot use', () => {
  const { logger, warn } = createWarnLogger()

  expect(
    clash.getClashNodes(
      [
        snellV6Node,
        {
          ...snellV6Node,
          nodeName: 'stash',
          clashConfig: { clashCore: 'stash', enableSnellV6: true },
        },
        {
          ...snellV6Node,
          nodeName: 'short-psk',
          psk: 'short',
          clashConfig: { clashCore: 'clash.meta', enableSnellV6: true },
        },
        {
          ...snellV6Node,
          nodeName: 'v7',
          version: 7,
          clashConfig: { clashCore: 'clash.meta', enableSnellV6: true },
        },
      ],
      undefined,
      { logger },
    ),
  ).toEqual([])
  expect(warn.mock.calls.map(([message]) => message)).toEqual([
    '未开启 clashConfig.enableSnellV6，节点 snell-v6 不会输出到 Clash',
    '只有 Mihomo 支持 Snell v6，节点 stash 会被省略。',
    'Mihomo 的 Snell v6 要求 psk 长度为 12 到 255 字节，节点 short-psk 会被省略',
    'Clash 尚不支持 Snell v7，节点 v7 会被省略。',
  ])
})
