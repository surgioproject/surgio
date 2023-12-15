import test from 'ava'

import { NodeTypeEnum, PossibleNodeConfigType } from '../../types'
import * as surge from '../surge'

test('getSurgeExtendHeaders', (t) => {
  t.is(
    surge.getSurgeExtendHeaders({
      foo: 'bar',
      'multi words key': 'multi words value',
    }),
    'foo:bar|multi words key:multi words value',
  )
})

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
      path: '/',
      port: 8080,
      tls: true,
      tls13: true,
      skipCertVerify: true,
      host: '',
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      binPath: '/usr/local/bin/v2ray',
      localPort: 61101,
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
      tfo: true,
      mptcp: true,
      underlyingProxy: 'another-proxy',
    },
  ]
  const txt1 = surge.getSurgeNodes(nodeList).split('\n')
  const txt2 = surge.getSurgeNodes(
    nodeList,
    (nodeConfig) => nodeConfig.nodeName === 'Test Node 1',
  )

  t.is(
    txt1[0],
    'Test Node 1 = ss, example.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password, udp-relay=true, obfs=tls, obfs-host=example.com',
  )
  t.is(
    txt1[1],
    'Test Node 2 = ss, example2.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password',
  )
  t.is(
    txt1[2],
    '测试中文 = external, exec = "/usr/local/bin/ssr-local", args = "-s", args = "127.0.0.1", args = "-p", args = "1234", args = "-m", args = "aes-128-cfb", args = "-o", args = "tls1.2_ticket_auth", args = "-O", args = "auth_aes128_md5", args = "-k", args = "aaabbb", args = "-l", args = "61100", args = "-b", args = "127.0.0.1", args = "-g", args = "breakwa11.moe", local-port = 61100, addresses = 127.0.0.1',
  )
  t.is(
    txt1[3],
    '测试 3 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/, ws-headers="host:1.1.1.1|user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1", vmess-aead=false',
  )
  t.is(
    txt1[4],
    '测试 4 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/, ws-headers="host:1.1.1.1|user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1", tls=true, vmess-aead=false',
  )
  t.is(
    txt1[5],
    '测试 5 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, encrypt-method=aes-128-gcm, vmess-aead=false',
  )
  t.is(
    txt1[6],
    'Test Node 4 = ss, example.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password, udp-relay=true, obfs=tls, obfs-host=example.com, mptcp=true',
  )
  t.is(
    txt1[7],
    'Test Node 5 = ss, example2.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password, mptcp=false',
  )
  t.is(
    txt1[8],
    'Test Node 6 = ss, example2.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password',
  )
  t.is(
    txt1[9],
    'Test Node 7 = ss, example2.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password, tfo=true, mptcp=true',
  )
  t.is(
    txt1[10],
    '测试 6 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/, ws-headers="host:1.1.1.1|user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1", tls=true, vmess-aead=false, tfo=true, mptcp=true, tls13=true, skip-cert-verify=true',
  )
  t.is(
    txt1[11],
    '测试 7 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/, ws-headers="host:1.1.1.1|user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1", tls=true, vmess-aead=false, tfo=true, mptcp=true, underlying-proxy=another-proxy, tls13=true, skip-cert-verify=true',
  )

  t.is(
    txt2,
    'Test Node 1 = ss, example.com, 443, encrypt-method=chacha20-ietf-poly1305, password=password, udp-relay=true, obfs=tls, obfs-host=example.com',
  )

  t.is(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan node 1',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
      },
    ]),
    'trojan node 1 = trojan, example.com, 443, password=password1',
  )

  t.is(
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
    'trojan node 2 = trojan, example.com, 443, password=password1, tfo=true, mptcp=true, skip-cert-verify=true, sni=sni.com',
  )

  t.is(
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
    'trojan node 1 = trojan, example.com, 443, password=password1, ws=true, ws-path=/ws',
  )

  t.is(
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
    'trojan node 1 = trojan, example.com, 443, password=password1, ws=true, ws-path=/ws, ws-headers="host:ws.example.com|test-key:test-value", sni=sni.example.com',
  )

  t.is(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks5-tls node 1',
        hostname: '1.1.1.1',
        port: 443,
        tls: true,
      },
    ]),
    'socks5-tls node 1 = socks5-tls, 1.1.1.1, 443',
  )

  t.is(
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
    'socks5-tls node 2 = socks5-tls, 1.1.1.1, 443, tfo=true',
  )

  t.is(
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
    'socks5-tls node 3 = socks5-tls, 1.1.1.1, 443, username=auto, password=auto',
  )

  t.is(
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
    'socks5-tls node 4 = socks5-tls, 1.1.1.1, 443, username=auto, password=auto, tfo=true, skip-cert-verify=true, sni=example.com',
  )

  t.is(
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
    'socks5-tls node 5 = socks5-tls, 1.1.1.1, 443, username=auto, password=auto, client-cert=item, tfo=true, skip-cert-verify=true, sni=example.com',
  )

  t.is(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks node 1',
        hostname: '1.1.1.1',
        port: '80',
      },
    ]),
    'socks node 1 = socks5, 1.1.1.1, 80',
  )

  t.is(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'socks node 2',
        hostname: '1.1.1.1',
        port: '80',
        tfo: true,
      },
    ]),
    'socks node 2 = socks5, 1.1.1.1, 80, tfo=true',
  )

  t.is(
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
    'socks node 3 = socks5, 1.1.1.1, 80, username=auto, password=auto, tfo=true',
  )

  t.is(
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
        binPath: '/usr/local/bin/v2ray',
        localPort: 61101,
        tfo: true,
        mptcp: true,
        testUrl: 'http://www.google.com',
      },
    ]),
    '测试 6 = vmess, 1.1.1.1, 8080, username=1386f85e-657b-4d6e-9d56-78badb75e1fd, ws=true, ws-path=/, ws-headers="host:1.1.1.1|user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1", tls=true, vmess-aead=false, tfo=true, mptcp=true, test-url=http://www.google.com, tls13=true, skip-cert-verify=true',
  )

  t.is(
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
    [
      '测试 Snell = snell, example.com, 443, psk=psk, shadow-tls-password=password, shadow-tls-sni=sni.example.com',
    ].join('\n'),
  )
})

test('getSurgeNodes - Wireguard', (t) => {
  t.is(
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
    [
      'wg node = wireguard, section-name = wg node',
      'wg node = wireguard, section-name = wg node, underlying-proxy=UnderlyingProxy, test-url=http://www.google.com',
    ].join('\n'),
  )
})

test('getSurgeNodes - Tuic', (t) => {
  t.is(
    surge.getSurgeNodes([
      {
        type: NodeTypeEnum.Tuic,
        nodeName: '测试 Tuic',
        hostname: 'example.com',
        port: 443,
        token: 'token',
        serverCertFingerprintSha256: 'sha256',
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
        alpn: ['h3'],
        sni: 'sni.example.com',
        skipCertVerify: true,
        version: 5,
        ecn: true,
      },
    ]),
    [
      '测试 Tuic = tuic, example.com, 443, token=token, server-cert-fingerprint-sha256=sha256',
      '测试 Tuic = tuic, example.com, 443, token=token, alpn=h3',
      '测试 Tuic = tuic, example.com, 443, token=token, skip-cert-verify=true, sni=sni.example.com, alpn=h3',
      '测试 Tuic = tuic-v5, example.com, 443, password=password, uuid=uuid, ecn=true, skip-cert-verify=true, sni=sni.example.com, alpn=h3',
    ].join('\n'),
  )
})

test('getSurgeNodes - Hysteria2', (t) => {
  t.is(
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
    [
      '测试 Hysteria2 = hysteria2, example.com, 443, password=password, download-bandwidth=100',
      '测试 Hysteria2 = hysteria2, example.com, 443, password=password, download-bandwidth=100, ecn=true, skip-cert-verify=true, sni=sni.example.com',
    ].join('\n'),
  )
})

test('getSurgeWireguardNodes', (t) => {
  t.snapshot(
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
  )
})

test('getSurgeNodeNames', (t) => {
  t.is(
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
    'Test Node 1, Test Node 2',
  )
})
