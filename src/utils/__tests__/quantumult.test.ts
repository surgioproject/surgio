import test from 'ava'

import { NodeTypeEnum } from '../../types'
import * as quantumult from '../quantumult'

test('getQuantumultXNodes', (t) => {
  const schemeList = quantumult
    .getQuantumultXNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'ws',
        nodeName: '测试 1',
        port: 8080,
        tls: false,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        wsOpts: {
          headers: {
            Host: 'example.com',
          },
          path: '/',
        },
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试 2',
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
        nodeName: '测试 3',
        port: 8080,
        tls: false,
        udpRelay: true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        wsOpts: {
          path: '/',
        },
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
        udpRelay: true,
        obfs: 'tls',
        obfsHost: 'gateway-carry.icloud.com',
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
    .split('\n')

  t.is(
    schemeList[0],
    'vmess=1.1.1.1:8080, method=chacha20-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, obfs=ws, obfs-uri=/, obfs-host=example.com, tag=测试 1',
  )
  t.is(
    schemeList[1],
    'vmess=1.1.1.1:8080, method=chacha20-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, tag=测试 2',
  )
  t.is(
    schemeList[2],
    'vmess=1.1.1.1:8080, method=chacha20-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, udp-relay=true, obfs=ws, obfs-uri=/, tag=测试 3',
  )
  t.is(
    schemeList[3],
    'shadowsocks=hk.example.com:10000, method=chacha20-ietf, password=password, ssr-protocol=auth_aes128_md5, ssr-protocol-param=, obfs=tls1.2_ticket_auth, obfs-host=music.163.com, tag=🇭🇰HK',
  )
  t.is(
    schemeList[4],
    'http=a.com:443, username=snsms, password=nndndnd, over-tls=true, tls-verification=true, tag=test',
  )
  t.is(
    schemeList[5],
    'shadowsocks=us.example.com:443, method=chacha20-ietf-poly1305, password=password, obfs=tls, obfs-host=gateway-carry.icloud.com, udp-relay=true, fast-open=true, tag=🇺🇸US 1',
  )
  t.is(
    schemeList[6],
    'vmess=1.1.1.1:443, method=chacha20-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, obfs=over-tls, tls-verification=true, tag=测试 4',
  )

  t.is(
    quantumult.getQuantumultXNodes([
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
        udpRelay: true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
    ]),
    'vmess=1.1.1.1:443, method=chacha20-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, udp-relay=true, obfs=over-tls, tls-verification=true, tls13=true, tag=测试',
  )

  t.is(
    quantumult.getQuantumultXNodes([
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
        udpRelay: true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        quantumultXConfig: {
          vmessAEAD: true,
        },
      },
    ]),
    'vmess=1.1.1.1:443, method=chacha20-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, udp-relay=true, aead=true, obfs=over-tls, tls-verification=true, tls13=true, tag=测试',
  )
  t.is(
    quantumult.getQuantumultXNodes([
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
  )
  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
      },
    ]),
    'trojan=example.com:443, password=password1, tls-verification=true, over-tls=true, tag=trojan',
  )
  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        udpRelay: true,
        skipCertVerify: true,
        tfo: true,
      },
    ]),
    'trojan=example.com:443, password=password1, tls-verification=false, fast-open=true, udp-relay=true, over-tls=true, tag=trojan',
  )
  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        sni: 'sni.example.com',
        udpRelay: true,
        skipCertVerify: true,
        tfo: true,
        tls13: true,
      },
    ]),
    'trojan=example.com:443, password=password1, tls-verification=false, fast-open=true, udp-relay=true, tls13=true, over-tls=true, tls-host=sni.example.com, tag=trojan',
  )
  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        sni: 'sni.example.com',
        udpRelay: true,
        skipCertVerify: true,
        tfo: true,
        tls13: true,
        network: 'ws',
        wsPath: '/ws',
        wsHeaders: {
          host: 'example.com',
          'multi words key': 'multi words value',
        },
      },
    ]),
    'trojan=example.com:443, password=password1, tls-verification=false, fast-open=true, udp-relay=true, tls13=true, obfs=wss, obfs-uri=/ws, obfs-host=sni.example.com, tag=trojan',
  )

  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        sni: 'sni.example.com',
        udpRelay: true,
        skipCertVerify: true,
        tfo: true,
        tls13: true,
        network: 'ws',
        wsPath: '/ws',
        wsHeaders: {
          host: 'example.com',
          'multi words key': 'multi words value',
        },
        testUrl: 'http://example.com',
      },
    ]),
    'trojan=example.com:443, password=password1, tls-verification=false, fast-open=true, udp-relay=true, tls13=true, obfs=wss, obfs-uri=/ws, obfs-host=sni.example.com, server_check_url=http://example.com, tag=trojan',
  )

  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.AnyTLS,
        nodeName: 'anytls',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
      },
    ]),
    'anytls=example.com:443, password=password1, over-tls=true, tls-verification=true, tag=anytls',
  )

  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.AnyTLS,
        nodeName: 'anytls-standard-tls-01',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        sni: 'sni.example.com',
        udpRelay: true,
        skipCertVerify: true,
        tfo: true,
        tls13: true,
        testUrl: 'http://example.com',
      },
    ]),
    'anytls=example.com:443, password=password1, over-tls=true, tls-host=sni.example.com, tls-verification=false, udp-relay=true, fast-open=true, tls13=true, server_check_url=http://example.com, tag=anytls-standard-tls-01',
  )

  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.AnyTLS,
        nodeName: 'anytls-reality-tls-01',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        sni: 'sni.example.com',
        realityOpts: {
          publicKey: 'udCD6aJAy_l_rXtv2gRVJmY3n0m7ei08u4mqhF6PgkA',
          shortId: '0123456789abcdef',
        },
        udpRelay: true,
        skipCertVerify: true,
        tfo: true,
        tls13: true,
        testUrl: 'http://example.com',
      },
    ]),
    'anytls=example.com:443, password=password1, over-tls=true, tls-host=sni.example.com, reality-base64-pubkey=udCD6aJAy_l_rXtv2gRVJmY3n0m7ei08u4mqhF6PgkA, reality-hex-shortid=0123456789abcdef, tls-verification=true, udp-relay=true, fast-open=true, tls13=true, server_check_url=http://example.com, tag=anytls-reality-tls-01',
  )

  t.is(
    quantumult.getQuantumultXNodes([
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
        udpRelay: true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        quantumultXConfig: {
          vmessAEAD: true,
        },
        testUrl: 'http://example.com',
      },
    ]),
    'vmess=1.1.1.1:443, method=chacha20-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, udp-relay=true, aead=true, obfs=over-tls, tls-verification=true, tls13=true, server_check_url=http://example.com, tag=测试',
  )

  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Vless,
        hostname: '1.1.1.1',
        network: 'tcp',
        nodeName: '测试',
        method: 'none',
        port: 443,
        tls13: true,
        udpRelay: true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        testUrl: 'http://example.com',
      },
    ]),
    'vless=1.1.1.1:443, method=none, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, udp-relay=true, obfs=over-tls, tls-verification=true, tls13=true, server_check_url=http://example.com, tag=测试',
  )

  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.HTTPS,
        nodeName: 'test',
        hostname: 'a.com',
        port: 443,
        tls13: true,
        username: 'snsms',
        password: 'nndndnd',
        testUrl: 'http://example.com',
      },
    ]),
    'http=a.com:443, username=snsms, password=nndndnd, over-tls=true, tls-verification=true, tls13=true, server_check_url=http://example.com, tag=test',
  )
  t.is(
    quantumult.getQuantumultXNodes([
      {
        nodeName: '🇺🇸US 1',
        type: NodeTypeEnum.Shadowsocks,
        hostname: 'us.example.com',
        port: 443,
        method: 'chacha20-ietf-poly1305',
        password: 'password',
        udpRelay: true,
        obfs: 'tls',
        obfsHost: 'gateway-carry.icloud.com',
        testUrl: 'http://example.com',
      },
    ]),
    'shadowsocks=us.example.com:443, method=chacha20-ietf-poly1305, password=password, obfs=tls, obfs-host=gateway-carry.icloud.com, udp-relay=true, server_check_url=http://example.com, tag=🇺🇸US 1',
  )
  t.is(
    quantumult.getQuantumultXNodes([
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
        testUrl: 'http://example.com',
      },
    ]),
    'shadowsocks=hk.example.com:10000, method=chacha20-ietf, password=password, ssr-protocol=auth_aes128_md5, ssr-protocol-param=, obfs=tls1.2_ticket_auth, obfs-host=music.163.com, server_check_url=http://example.com, tag=🇭🇰HK',
  )
})

test('getQuantumultXNodeNames', (t) => {
  t.is(
    quantumult.getQuantumultXNodeNames([
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
        nodeName: 'AnyTLS Node',
        type: NodeTypeEnum.AnyTLS,
        hostname: 'anytls.example.com',
        port: '443',
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
    ['Test Node 1', 'Test Node 2', 'AnyTLS Node'].join(', '),
  )
})
