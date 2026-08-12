import { expect, test } from 'vitest'

import { NodeTypeEnum, PossibleNodeConfigType } from '../../types'
import * as surfboard from '../surfboard'

test('getSurfboardExtendHeaders', () => {
  expect(
    surfboard.getSurfboardExtendHeaders({
      foo: 'bar',
      'multi words key': 'multi words value',
    }),
  ).toBe('foo:bar|multi words key:multi words value')
})

test('getSurfboardNodes', async () => {
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
      enable: false,
      nodeName: 'Test Node 3',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example2.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
    },
    {
      nodeName: 'Test Node 4',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      obfs: 'tls',
      obfsHost: 'example.com',
      udpRelay: true,
      mptcp: true,
    },
    {
      nodeName: 'Test Node 5',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example2.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      mptcp: false,
    },
    {
      nodeName: 'Test Node 6',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example2.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      tfo: true,
      mptcp: true,
    },
    {
      type: NodeTypeEnum.Vmess,
      alterId: '64',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: '测试 1',
      port: 8080,
      tls: true,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      surfboardConfig: {
        vmessAEAD: true,
      },
      wsOpts: {
        path: '/',
      },
    },
    {
      type: NodeTypeEnum.Vmess,
      alterId: '64',
      hostname: '1.1.1.1',
      method: 'aes-128-gcm',
      network: 'tcp',
      nodeName: '测试 2',
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
      port: 8080,
      tls: true,
      tls13: true,
      skipCertVerify: true,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      tfo: true,
      mptcp: true,
      wsOpts: {
        path: '/',
      },
    },
  ]

  expect(surfboard.getSurfboardNodes(nodeList)).toMatchSnapshot()

  expect(
    surfboard.getSurfboardNodes(
      nodeList,
      (nodeConfig) => nodeConfig.nodeName === 'Test Node 1',
    ),
  ).toBe(
    'Test Node 1 = ss, example.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password, udp-relay=true, obfs=tls, obfs-host=example.com',
  )

  expect(
    surfboard.getSurfboardNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan node 1',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
      },
    ]),
  ).toBe('trojan node 1 = trojan, example.com, 443, password=password1')

  expect(
    surfboard.getSurfboardNodes([
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
  ).toBe(
    'trojan node 2 = trojan, example.com, 443, password=password1, sni=sni.com, skip-cert-verify=true',
  )

  expect(
    surfboard.getSurfboardNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan node 1',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        network: 'ws',
        wsPath: '/ws',
      },
    ]),
  ).toBe(
    'trojan node 1 = trojan, example.com, 443, password=password1, ws=true, ws-path=/ws',
  )

  expect(
    surfboard.getSurfboardNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan node 1',
        hostname: 'example.com',
        port: 443,
        sni: 'sni.example.com',
        password: 'password1',
        network: 'ws',
        wsPath: '/ws',
        wsHeaders: {
          host: 'ws.example.com',
          'test-key': 'test-value',
        },
      },
    ]),
  ).toBe(
    'trojan node 1 = trojan, example.com, 443, password=password1, sni=sni.example.com, ws=true, ws-path=/ws, ws-headers="host:ws.example.com|test-key:test-value"',
  )

  expect(
    surfboard.getSurfboardNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks5-tls node 1',
        hostname: '1.1.1.1',
        port: 443,
        tls: true,
      },
    ]),
  ).toBe('socks5-tls node 1 = socks5-tls, 1.1.1.1, 443')

  expect(
    surfboard.getSurfboardNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks5-tls node 2',
        hostname: '1.1.1.1',
        port: 443,
        tfo: true,
        tls: true,
      },
    ]),
  ).toBe('socks5-tls node 2 = socks5-tls, 1.1.1.1, 443')

  expect(
    surfboard.getSurfboardNodes([
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
  ).toBe(
    'socks5-tls node 3 = socks5-tls, 1.1.1.1, 443, username=auto, password=auto',
  )

  expect(
    surfboard.getSurfboardNodes([
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
  ).toBe(
    'socks5-tls node 4 = socks5-tls, 1.1.1.1, 443, username=auto, password=auto, sni=example.com, skip-cert-verify=true',
  )

  expect(
    surfboard.getSurfboardNodes([
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
  ).toBe(
    'socks5-tls node 5 = socks5-tls, 1.1.1.1, 443, username=auto, password=auto, sni=example.com, skip-cert-verify=true, client-cert=item',
  )

  expect(
    surfboard.getSurfboardNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks node 1',
        hostname: '1.1.1.1',
        port: '80',
      },
    ]),
  ).toBe('socks node 1 = socks5, 1.1.1.1, 80')

  expect(
    surfboard.getSurfboardNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks node 2',
        hostname: '1.1.1.1',
        port: '80',
        tfo: true,
      },
    ]),
  ).toBe('socks node 2 = socks5, 1.1.1.1, 80')

  expect(
    surfboard.getSurfboardNodes([
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
  ).toBe('socks node 3 = socks5, 1.1.1.1, 80, username=auto, password=auto')

  expect(
    surfboard.getSurfboardNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'ws',
        nodeName: '测试 6',
        port: 8080,
        tls: true,
        tls13: true,
        skipCertVerify: true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        tfo: true,
        mptcp: true,
        testUrl: 'http://www.google.com',
        wsOpts: {
          path: '/',
        },
      },
    ]),
  ).toBe(
    '测试 6 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/, ws-headers="user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1", tls=true, skip-cert-verify=true, vmess-aead=false',
  )
})

test('getSurfboardNodeNames', () => {
  expect(
    surfboard.getSurfboardNodeNames([
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
        enable: false,
        nodeName: 'Test Node 3',
        type: NodeTypeEnum.Shadowsocks,
        hostname: 'example2.com',
        port: '443',
        method: 'chacha20-ietf-poly1305',
        password: 'password',
      },
    ]),
  ).toBe(['Test Node 1', 'Test Node 2'].join(', '))
})
