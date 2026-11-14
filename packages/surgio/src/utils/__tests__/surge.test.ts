import { expect, test, vi } from 'vitest'

import { NodeTypeEnum, PossibleNodeConfigType } from '../../types.js'
import * as surge from '../surge.js'

test('getSurgeExtendHeaders', () => {
  expect(
    surge.getSurgeExtendHeaders({
      foo: 'bar',
      'multi words key': 'multi words value',
    }),
  ).toBe('foo:bar|multi words key:multi words value')
})

test('getSurgeNodes', async () => {
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
      type: NodeTypeEnum.Vmess,
      alterId: '64',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: '测试 3',
      port: 8080,
      tls: false,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      wsOpts: {
        path: '/',
      },
    },
    {
      type: NodeTypeEnum.Vmess,
      alterId: '64',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: '测试 4',
      port: 8080,
      tls: true,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
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
      nodeName: '测试 5',
      port: 8080,
      tls: false,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
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
    },
    {
      nodeName: 'Test Node 7',
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
      nodeName: '测试 6',
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
    {
      type: NodeTypeEnum.Vmess,
      alterId: '64',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: '测试 7',
      port: 8080,
      tls: true,
      tls13: true,
      skipCertVerify: true,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      tfo: true,
      mptcp: true,
      underlyingProxy: 'another-proxy',
      wsOpts: {
        path: '/',
      },
    },
  ]
  const txt1 = surge.getSurgeNodes(nodeList).split('\n')
  const txt2 = surge.getSurgeNodes(
    nodeList,
    (nodeConfig) => nodeConfig.nodeName === 'Test Node 1',
  )

  expect(txt1[0]).toBe(
    'Test Node 1 = ss, example.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password, udp-relay=true, obfs=tls, obfs-host=example.com',
  )
  expect(txt1[1]).toBe(
    'Test Node 2 = ss, example2.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password',
  )
  expect(txt1[2]).toBe(
    '测试 3 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/, ws-headers="user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1", vmess-aead=false',
  )
  expect(txt1[3]).toBe(
    '测试 4 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/, ws-headers="user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1", tls=true, vmess-aead=false',
  )
  expect(txt1[4]).toBe(
    '测试 5 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, encrypt-method=aes-128-gcm, vmess-aead=false',
  )
  expect(txt1[5]).toBe(
    'Test Node 4 = ss, example.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password, udp-relay=true, obfs=tls, obfs-host=example.com, mptcp=true',
  )
  expect(txt1[6]).toBe(
    'Test Node 5 = ss, example2.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password, mptcp=false',
  )
  expect(txt1[7]).toBe(
    'Test Node 6 = ss, example2.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password',
  )
  expect(txt1[8]).toBe(
    'Test Node 7 = ss, example2.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password, tfo=true, mptcp=true',
  )
  expect(txt1[9]).toBe(
    '测试 6 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/, ws-headers="user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1", tls=true, vmess-aead=false, tfo=true, mptcp=true, tls13=true, skip-cert-verify=true',
  )
  expect(txt1[10]).toBe(
    '测试 7 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/, ws-headers="user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1", tls=true, vmess-aead=false, tfo=true, mptcp=true, underlying-proxy=another-proxy, tls13=true, skip-cert-verify=true',
  )

  expect(txt2).toBe(
    'Test Node 1 = ss, example.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password, udp-relay=true, obfs=tls, obfs-host=example.com',
  )

  expect(
    surge.getSurgeNodes([
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
    surge.getSurgeNodes([
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
    'trojan node 2 = trojan, example.com, 443, password=password1, tfo=true, mptcp=true, skip-cert-verify=true, sni=sni.com',
  )

  expect(
    surge.getSurgeNodes([
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
    surge.getSurgeNodes([
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
    'trojan node 1 = trojan, example.com, 443, password=password1, ws=true, ws-path=/ws, ws-headers="host:ws.example.com|test-key:test-value", sni=sni.example.com',
  )

  expect(
    surge.getSurgeNodes([
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
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks5-tls node 2',
        hostname: '1.1.1.1',
        port: 443,
        tfo: true,
        tls: true,
      },
    ]),
  ).toBe('socks5-tls node 2 = socks5-tls, 1.1.1.1, 443, tfo=true')

  expect(
    surge.getSurgeNodes([
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
    surge.getSurgeNodes([
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
    'socks5-tls node 4 = socks5-tls, 1.1.1.1, 443, username=auto, password=auto, tfo=true, skip-cert-verify=true, sni=example.com',
  )

  expect(
    surge.getSurgeNodes([
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
    'socks5-tls node 5 = socks5-tls, 1.1.1.1, 443, username=auto, password=auto, client-cert=item, tfo=true, skip-cert-verify=true, sni=example.com',
  )

  expect(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks node 1',
        hostname: '1.1.1.1',
        port: '80',
        blockQuic: 'auto',
      },
    ]),
  ).toBe('socks node 1 = socks5, 1.1.1.1, 80, block-quic=auto')

  expect(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks node 2',
        hostname: '1.1.1.1',
        port: '80',
        tfo: true,
        blockQuic: 'on',
      },
    ]),
  ).toBe('socks node 2 = socks5, 1.1.1.1, 80, tfo=true, block-quic=on')

  expect(
    surge.getSurgeNodes([
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
  ).toBe(
    'socks node 3 = socks5, 1.1.1.1, 80, username=auto, password=auto, tfo=true',
  )

  expect(
    surge.getSurgeNodes([
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
        tfo: true,
        mptcp: true,
        testUrl: 'http://www.google.com',
      },
    ]),
  ).toBe(
    '测试 6 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/, ws-headers="user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1", tls=true, vmess-aead=false, tfo=true, mptcp=true, test-url=http://www.google.com, tls13=true, skip-cert-verify=true',
  )

  expect(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.Snell,
        nodeName: '测试 Snell',
        hostname: 'example.com',
        port: 443,
        psk: 'psk',
        shadowTls: {
          password: 'password',
          sni: 'sni.example.com',
        },
      },
    ]),
  ).toBe(
    [
      '测试 Snell = snell, example.com, 443, psk=psk, shadow-tls-password=password, shadow-tls-sni=sni.example.com',
    ].join('\n'),
  )
})

test('getSurgeNodes supports masque nodes', () => {
  expect(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.Masque,
        authMode: 'basic-auth',
        nodeName: 'MASQUE',
        hostname: 'masque.example.com',
        port: 443,
        username: 'user',
        password: 'pass',
        alpn: ['h3', 'h3-29'],
        sni: 'sni.example.com',
        skipCertVerify: true,
        ecn: false,
        portHopping: '1234;5000-6000',
        portHoppingInterval: 20,
      },
    ]),
  ).toBe(
    'MASQUE = masque, masque.example.com, 443, username=user, password=pass, alpn="h3,h3-29", ecn=false, skip-cert-verify=true, sni=sni.example.com, port-hopping=1234;5000-6000, port-hopping-interval=20',
  )

  expect(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.Masque,
        authMode: 'basic-auth',
        nodeName: 'MASQUE without auth',
        hostname: 'masque.example.com',
        port: 443,
      },
    ]),
  ).toBe('MASQUE without auth = masque, masque.example.com, 443')

  expect(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.Masque,
        authMode: 'key-pair',
        nodeName: 'WARP MASQUE',
        hostname: 'masque.example.com',
        port: 443,
        privateKey: 'private-key',
        publicKey: 'public-key',
        ip: '172.16.0.2/32',
      },
    ]),
  ).toBe('')
})

test('getSurgeNodes supports HTTP/2 TrustTunnel nodes', () => {
  expect(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.TrustTunnel,
        nodeName: 'TrustTunnel',
        hostname: 'trust.example.com',
        port: 443,
        username: 'user',
        password: 'pass',
        alpn: ['h2'],
        headers: {
          'X-Client': 'Surge',
          'X-Token': 'token',
        },
        maxStreams: 3,
        skipCertVerify: true,
        sni: 'sni.example.com',
        serverCertFingerprintSha256: 'sha256',
        underlyingProxy: 'upstream',
      },
    ]),
  ).toBe(
    'TrustTunnel = trust-tunnel, trust.example.com, 443, username=user, password=pass, max-streams=3, alpn="h2", headers=X-Client:Surge;X-Token:token, underlying-proxy=upstream, skip-cert-verify=true, sni=sni.example.com, server-cert-fingerprint-sha256=sha256',
  )

  expect(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.TrustTunnel,
        nodeName: 'TrustTunnel QUIC',
        hostname: 'trust.example.com',
        port: 443,
        username: 'user',
        password: 'pass',
        quic: true,
      },
    ]),
  ).toBe('')
})

test('getSurgeNodes - AnyTLS', () => {
  expect(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.AnyTLS,
        nodeName: 'anytls default',
        hostname: 'example.com',
        port: 443,
        password: 'password',
      },
      {
        type: NodeTypeEnum.AnyTLS,
        nodeName: 'anytls reuse on',
        hostname: 'example.com',
        port: 443,
        password: 'password',
        reuse: true,
      },
      {
        type: NodeTypeEnum.AnyTLS,
        nodeName: 'anytls reuse off',
        hostname: 'example.com',
        port: 443,
        password: 'password',
        reuse: false,
      },
    ]),
  ).toBe(
    [
      'anytls default = anytls, example.com, 443, password=password',
      'anytls reuse on = anytls, example.com, 443, password=password, reuse=true',
      'anytls reuse off = anytls, example.com, 443, password=password, reuse=false',
    ].join('\n'),
  )
})

test('getSurgeNodes - Wireguard', () => {
  expect(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.Wireguard,
        nodeName: 'wg node',
        privateKey: 'privateKey',
        selfIp: '10.0.0.1',
        mtu: 1420,
        peers: [
          {
            endpoint: 'wg.example.com:51820',
            publicKey: 'publicKey',
          },
        ],
      },
      {
        type: NodeTypeEnum.Wireguard,
        nodeName: 'wg node',
        privateKey: 'privateKey',
        selfIp: '10.0.0.1',
        mtu: 1420,
        peers: [
          {
            endpoint: 'wg.example.com:51820',
            publicKey: 'publicKey',
          },
        ],
        underlyingProxy: 'UnderlyingProxy',
        testUrl: 'http://www.google.com',
      },
    ]),
  ).toBe(
    [
      'wg node = wireguard, section-name = wg node',
      'wg node = wireguard, section-name = wg node, underlying-proxy=UnderlyingProxy, test-url=http://www.google.com',
    ].join('\n'),
  )
})

test('getSurgeNodes - Tuic', () => {
  expect(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.Tuic,
        nodeName: '测试 Tuic',
        hostname: 'example.com',
        port: 443,
        token: 'token',
        serverCertFingerprintSha256: 'sha256',
        portHopping: '5000-6000;7000',
        portHoppingInterval: 10,
      },
      {
        type: NodeTypeEnum.Tuic,
        nodeName: '测试 Tuic',
        hostname: 'example.com',
        port: 443,
        token: 'token',
        alpn: ['h3'],
      },
      {
        type: NodeTypeEnum.Tuic,
        nodeName: '测试 Tuic',
        hostname: 'example.com',
        port: 443,
        token: 'token',
        alpn: ['foo', 'h2', 'h3'],
      },
      {
        type: NodeTypeEnum.Tuic,
        nodeName: '测试 Tuic',
        hostname: 'example.com',
        port: 443,
        token: 'token',
        alpn: ['foo', 'bar'],
      },
      {
        type: NodeTypeEnum.Tuic,
        nodeName: '测试 Tuic',
        hostname: 'example.com',
        port: 443,
        token: 'token',
        alpn: ['h3'],
        sni: 'sni.example.com',
        skipCertVerify: true,
      },
      {
        type: NodeTypeEnum.Tuic,
        nodeName: '测试 Tuic',
        hostname: 'example.com',
        port: 443,
        password: 'password',
        uuid: 'uuid',
        version: 5,
        alpn: ['h3'],
        sni: 'sni.example.com',
        skipCertVerify: true,
        ecn: true,
      },
    ]),
  ).toBe(
    [
      '测试 Tuic = tuic, example.com, 443, token=token, server-cert-fingerprint-sha256=sha256, port-hopping=5000-6000;7000, port-hopping-interval=10',
      '测试 Tuic = tuic, example.com, 443, token=token, alpn=h3',
      '测试 Tuic = tuic, example.com, 443, token=token, alpn=h3',
      '测试 Tuic = tuic, example.com, 443, token=token, alpn=foo',
      '测试 Tuic = tuic, example.com, 443, token=token, skip-cert-verify=true, sni=sni.example.com, alpn=h3',
      '测试 Tuic = tuic-v5, example.com, 443, password=password, uuid=uuid, ecn=true, skip-cert-verify=true, sni=sni.example.com, alpn=h3',
    ].join('\n'),
  )
})

test('getSurgeNodes - Hysteria2', () => {
  expect(
    surge.getSurgeNodes([
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
        ecn: true,
        sni: 'sni.example.com',
        skipCertVerify: true,
        alpn: ['h2', 'h3'],
      },
    ]),
  ).toBe(
    [
      '测试 Hysteria2 = hysteria2, example.com, 443, password=password, download-bandwidth=100',
      '测试 Hysteria2 = hysteria2, example.com, 443, password=password, download-bandwidth=100, ecn=true, skip-cert-verify=true, sni=sni.example.com',
    ].join('\n'),
  )
})

test('getSurgeWireguardNodes', () => {
  expect(
    surge.getSurgeWireguardNodes([
      {
        type: NodeTypeEnum.Wireguard,
        nodeName: 'wg node',
        privateKey: 'privateKey',
        selfIp: '10.0.0.1',
        mtu: 1420,
        peers: [
          {
            endpoint: 'wg.example.com:51820',
            publicKey: 'publicKey',
          },
        ],
      },
      {
        type: NodeTypeEnum.Wireguard,
        nodeName: 'wg node',
        privateKey: 'privateKey',
        selfIp: '10.0.0.1',
        mtu: 1420,
        preferIpv6: true,
        selfIpV6: '2001:db8:85a3::8a2e:370:7334',
        dnsServers: ['1.1.1.1', '1.0.0.1'],
        peers: [
          {
            endpoint: 'wg.example.com:51820',
            publicKey: 'publicKey',
            allowedIps: '0.0.0.0/0',
            presharedKey: 'presharedKey',
            keepalive: 25,
          },
        ],
      },
      {
        type: NodeTypeEnum.Wireguard,
        nodeName: 'wg node',
        privateKey: 'privateKey',
        selfIp: '10.0.0.1',
        mtu: 1420,
        preferIpv6: true,
        selfIpV6: '2001:db8:85a3::8a2e:370:7334',
        dnsServers: ['1.1.1.1', '1.0.0.1'],
        peers: [
          {
            endpoint: 'wg.example.com:51821',
            publicKey: 'publicKey',
            allowedIps: '0.0.0.0/0, ::/0',
            presharedKey: 'presharedKey',
            keepalive: 25,
          },
          {
            endpoint: 'wg.example.com:51821',
            publicKey: 'publicKey',
            allowedIps: '0.0.0.0/0, ::/0',
            presharedKey: 'presharedKey',
            keepalive: 25,
          },
        ],
      },
    ]),
  ).toMatchSnapshot()
})

test('getSurgeNodes and getSurgeTailscaleNodes generate Tailscale policy', () => {
  const nodeList: ReadonlyArray<PossibleNodeConfigType> = [
    {
      type: NodeTypeEnum.Tailscale,
      nodeName: 'tailnet',
      authKey: 'tskey-auth-example',
      hostname: 'surge-mac',
      controlUrl: 'https://controlplane.tailscale.com',
      derpOnly: false,
      exitNode: 'none',
      idleKeepalive: 0,
      preferIpv6: false,
      dnsServers: ['100.100.100.100', '[fd7a:115c:a1e0::53]:53'],
      mtu: 1280,
      underlyingProxy: 'upstream',
      testUrl: 'http://100.64.0.1/',
      testTimeout: 0,
      ecn: false,
      noErrorAlert: false,
      tfo: true,
    },
    {
      type: NodeTypeEnum.Tailscale,
      nodeName: 'disabled-tailnet',
      authKey: 'tskey-auth-disabled',
      enable: false,
    },
    {
      type: NodeTypeEnum.Tailscale,
      nodeName: 'filtered-tailnet',
      authKey: 'tskey-auth-filtered',
    },
  ]
  const filter = (node: PossibleNodeConfigType) =>
    node.nodeName !== 'filtered-tailnet'

  expect(surge.getSurgeNodes(nodeList, filter)).toBe(
    'tailnet = tailscale, section-name=tailnet, underlying-proxy=upstream, test-url=http://100.64.0.1/, test-timeout=0, ecn=false, no-error-alert=false',
  )
  expect(surge.getSurgeTailscaleNodes(nodeList, filter)).toBe(
    [
      '[Tailscale tailnet]',
      'auth-key=tskey-auth-example',
      'control-url=https://controlplane.tailscale.com',
      'hostname=surge-mac',
      'derp-only=false',
      'exit-node=none',
      'idle-keepalive=0',
      'prefer-ipv6=false',
      'dns-server=100.100.100.100, [fd7a:115c:a1e0::53]:53',
      'mtu=1280',
    ].join('\n'),
  )
})

test('Surge Tailscale generation requires authKey', () => {
  const nodeList: ReadonlyArray<PossibleNodeConfigType> = [
    {
      type: NodeTypeEnum.Tailscale,
      nodeName: 'interactive-tailnet',
    },
  ]

  for (const generate of [
    () => surge.getSurgeNodes(nodeList),
    () => surge.getSurgeTailscaleNodes(nodeList),
  ]) {
    expect(generate).toThrow('interactive-tailnet')
    expect(generate).toThrow('authKey')
  }
})

test('Surge omits Shadowsocksr nodes', () => {
  const warn = vi.fn()
  const logger = { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() }
  const nodeList: ReadonlyArray<PossibleNodeConfigType> = [
    {
      nodeName: 'SSR Node',
      type: NodeTypeEnum.Shadowsocksr,
      hostname: '127.0.0.1',
      port: 1234,
      method: 'aes-128-cfb',
      password: 'password',
      obfs: 'plain',
      obfsparam: '',
      protocol: 'origin',
      protoparam: '',
    },
    {
      nodeName: 'SS Node',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
    },
  ]

  const result = {
    names: surge.getSurgeNodeNames(nodeList, undefined, { logger }),
    nodes: surge.getSurgeNodes(nodeList, undefined, { logger }),
  }

  expect(result.nodes).toBe(
    'SS Node = ss, example.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password',
  )
  expect(result.names).toBe('SS Node')
  expect(warn).toHaveBeenCalledTimes(2)
  expect(warn).toHaveBeenCalledWith(
    '不支持为 Surge 生成 shadowsocksr 的节点，节点 SSR Node 会被省略',
  )
})

test('getSurgeNodeNames', () => {
  expect(
    surge.getSurgeNodeNames([
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
    ]),
  ).toBe('Test Node 1, Test Node 2')
})

test('getSurgeWireguardNodes shares filtering with getSurgeNodes', () => {
  const wg = (nodeName: string, enable?: boolean): PossibleNodeConfigType => ({
    type: NodeTypeEnum.Wireguard,
    nodeName,
    enable,
    privateKey: 'privateKey',
    selfIp: '10.0.0.1',
    peers: [{ endpoint: 'wg.example.com:51820', publicKey: 'publicKey' }],
  })
  const nodeList: ReadonlyArray<PossibleNodeConfigType> = [
    wg('kept'),
    wg('filtered'),
    wg('disabled', false),
  ]
  const filter = (node: PossibleNodeConfigType) => node.nodeName !== 'filtered'

  expect(surge.getSurgeNodes(nodeList, filter)).toBe(
    'kept = wireguard, section-name = kept',
  )
  expect(surge.getSurgeNodeNames(nodeList, filter)).toBe('kept')
  expect(
    surge.getSurgeWireguardNodes(nodeList, filter).match(/\[WireGuard .+\]/g),
  ).toEqual(['[WireGuard kept]'])
})

test('getSurgeNodes outputs ipVersion for every proxy type', () => {
  expect(
    surge.getSurgeNodes([
      {
        nodeName: 'SS Node',
        type: NodeTypeEnum.Shadowsocks,
        hostname: 'example.com',
        port: 443,
        method: 'chacha20-ietf-poly1305',
        password: 'password',
        ipVersion: 'prefer-v4',
      },
    ]),
  ).toBe(
    'SS Node = ss, example.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password, ip-version=prefer-v4',
  )
})

test('getSurgeNodes outputs Snell ipVersion once', () => {
  expect(
    surge.getSurgeNodes([
      {
        nodeName: 'Snell Node',
        type: NodeTypeEnum.Snell,
        hostname: 'example.com',
        port: 443,
        psk: 'psk',
        ipVersion: 'v6-only',
      },
    ]),
  ).toBe('Snell Node = snell, example.com, 443, psk=psk, ip-version=v6-only')
})

test('getSurgeNodes maps Mihomo ipVersion values', () => {
  expect(
    surge.getSurgeNodes([
      {
        nodeName: 'Socks5 Node',
        type: NodeTypeEnum.Socks5,
        hostname: 'example.com',
        port: 1080,
        ipVersion: 'ipv4-prefer',
      },
    ]),
  ).toBe('Socks5 Node = socks5, example.com, 1080, ip-version=prefer-v4')
})

test('getSurgeNodes omits unknown ipVersion values', () => {
  const warn = vi.fn()
  const logger = { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() }

  expect(
    surge.getSurgeNodes(
      [
        {
          nodeName: 'Socks5 Node',
          type: NodeTypeEnum.Socks5,
          hostname: 'example.com',
          port: 1080,
          ipVersion: 'constructor',
        },
      ],
      undefined,
      { logger },
    ),
  ).toBe('Socks5 Node = socks5, example.com, 1080')
  expect(warn).toHaveBeenCalledWith(
    'Surge 不支持 ipVersion=constructor，节点 Socks5 Node 将不包含此字段',
  )
})

test('getSurgeNodes omits VLESS nodes unless enableVless is set', () => {
  const warn = vi.fn()
  const logger = { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() }
  const node = {
    type: NodeTypeEnum.Vless,
    nodeName: 'vless tcp',
    hostname: 'example.com',
    port: 443,
    method: 'none',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    network: 'tcp',
  } as const

  expect(surge.getSurgeNodes([node], undefined, { logger })).toBe('')
  expect(
    surge.getSurgeNodes(
      [{ ...node, surgeConfig: { enableVless: false } }],
      undefined,
      { logger },
    ),
  ).toBe('')
  expect(warn).toHaveBeenCalledWith(
    '未开启 surgeConfig.enableVless，节点 vless tcp 不会输出到 Surge',
  )
})

test('getSurgeNodes - VLESS', () => {
  const base = {
    type: NodeTypeEnum.Vless,
    hostname: 'example.com',
    port: 443,
    method: 'none',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    surgeConfig: { enableVless: true },
  } as const

  expect(
    surge
      .getSurgeNodes([
        {
          ...base,
          nodeName: 'vless tcp',
          network: 'tcp',
          flow: 'xtls-rprx-vision',
          encryption: 'none',
          sni: 'sni.example.com',
          skipCertVerify: true,
        },
        {
          ...base,
          nodeName: 'vless reality',
          network: 'tcp',
          flow: 'xtls-rprx-vision',
          sni: 'www.microsoft.com',
          realityOpts: {
            publicKey: 'public-key',
            shortId: '0123abcd',
          },
        },
        {
          ...base,
          nodeName: 'vless ws',
          network: 'ws',
          wsOpts: {
            path: '/ws',
            headers: { Host: 'ws.example.com' },
          },
        },
        {
          ...base,
          nodeName: 'vless grpc reality',
          network: 'grpc',
          grpcOpts: { serviceName: 'service' },
          realityOpts: { publicKey: 'public-key' },
        },
      ])
      .split('\n'),
  ).toEqual([
    'vless tcp = vless, example.com, 443, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, flow=xtls-rprx-vision, tls=true, skip-cert-verify=true, sni=sni.example.com',
    'vless reality = vless, example.com, 443, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, flow=xtls-rprx-vision, reality-public-key=public-key, reality-short-id=0123abcd, sni=www.microsoft.com',
    'vless ws = vless, example.com, 443, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/ws, ws-headers="host:ws.example.com", tls=true',
    'vless grpc reality = vless, example.com, 443, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, grpc=true, grpc-service-name=service, reality-public-key=public-key',
  ])
})

test('getSurgeNodes - VLESS Encryption and XHTTP', () => {
  const encryption = 'mlkem768x25519plus.native.0rtt.client-key'
  const base = {
    type: NodeTypeEnum.Vless,
    hostname: 'example.com',
    port: 443,
    method: 'none',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    surgeConfig: { enableVless: true },
  } as const

  expect(
    surge
      .getSurgeNodes([
        { ...base, nodeName: 'tcp encryption', network: 'tcp', encryption },
        {
          ...base,
          nodeName: 'ws vision encryption',
          network: 'ws',
          flow: 'xtls-rprx-vision',
          encryption,
          wsOpts: { path: '/ws' },
        },
        {
          ...base,
          nodeName: 'xhttp',
          network: 'xhttp',
          sni: 'cdn.example.com',
          xhttpOpts: {
            path: '/xhttp',
            host: 'cdn.example.com',
            mode: 'packet-up',
            headers: { 'User-Agent': 'chrome' },
          },
        },
        {
          ...base,
          nodeName: 'xhttp h3',
          network: 'xhttp',
          alpn: ['h3'],
          xhttpOpts: { path: '/' },
        },
        {
          ...base,
          nodeName: 'xhttp alpn list',
          network: 'xhttp',
          alpn: ['h2', 'http/1.1'],
          xhttpOpts: { path: '/' },
        },
        {
          ...base,
          nodeName: 'xhttp reality vision encryption',
          network: 'xhttp',
          flow: 'xtls-rprx-vision',
          encryption,
          xhttpOpts: { path: '/xhttp', mode: 'stream-one' },
          realityOpts: { publicKey: 'public-key' },
        },
      ])
      .split('\n'),
  ).toEqual([
    `tcp encryption = vless, example.com, 443, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, encryption=${encryption}, tls=true`,
    `ws vision encryption = vless, example.com, 443, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, flow=xtls-rprx-vision, encryption=${encryption}, ws=true, ws-path=/ws, tls=true`,
    'xhttp = vless, example.com, 443, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, xhttp=true, xhttp-path=/xhttp, xhttp-host=cdn.example.com, xhttp-mode=packet-up, xhttp-headers="user-agent:chrome", tls=true, sni=cdn.example.com',
    'xhttp h3 = vless, example.com, 443, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, xhttp=true, xhttp-path=/, alpn=h3, tls=true',
    'xhttp alpn list = vless, example.com, 443, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, xhttp=true, xhttp-path=/, alpn="h2,http/1.1", tls=true',
    `xhttp reality vision encryption = vless, example.com, 443, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, flow=xtls-rprx-vision, encryption=${encryption}, xhttp=true, xhttp-path=/xhttp, xhttp-mode=stream-one, reality-public-key=public-key`,
  ])
})

test('getSurgeNodes omits VLESS combinations Surge does not support', () => {
  const warn = vi.fn()
  const logger = { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() }
  const base = {
    type: NodeTypeEnum.Vless,
    hostname: 'example.com',
    port: 443,
    method: 'none',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    surgeConfig: { enableVless: true },
  } as const
  const nodeList: PossibleNodeConfigType[] = [
    { ...base, nodeName: 'h2 transport', network: 'h2' },
    {
      ...base,
      nodeName: 'xhttp unknown mode',
      network: 'xhttp',
      xhttpOpts: { path: '/', mode: 'unknown-mode' },
    },
    { ...base, nodeName: 'ws vision', network: 'ws', flow: 'xtls-rprx-vision' },
    {
      ...base,
      nodeName: 'xhttp vision',
      network: 'xhttp',
      flow: 'xtls-rprx-vision',
      xhttpOpts: { path: '/' },
    },
    {
      ...base,
      nodeName: 'grpc vision',
      network: 'grpc',
      flow: 'xtls-rprx-vision',
      encryption: 'mlkem768x25519plus.native.1rtt.client-key',
    },
    {
      ...base,
      nodeName: 'ws reality',
      network: 'ws',
      realityOpts: { publicKey: 'public-key' },
    },
    {
      ...base,
      nodeName: 'legacy flow',
      network: 'tcp',
      flow: 'xtls-rprx-direct',
    },
  ]

  expect(surge.getSurgeNodes(nodeList, undefined, { logger })).toBe('')
  expect(surge.getSurgeNodeNames(nodeList, undefined, { logger })).toBe('')
  expect(warn.mock.calls.map(([message]) => message)).toEqual(
    expect.arrayContaining([
      expect.stringContaining('h2 transport'),
      expect.stringContaining('xhttp unknown mode'),
      expect.stringContaining('ws vision'),
      expect.stringContaining('xhttp vision'),
      expect.stringContaining('grpc vision'),
      expect.stringContaining('ws reality'),
      expect.stringContaining('legacy flow'),
    ]),
  )
  expect(warn).toHaveBeenCalledTimes(nodeList.length * 2)
})
