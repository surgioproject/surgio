import test from 'ava'
import sinon from 'sinon'
import { transports } from '@surgio/logger'

import { NodeTypeEnum } from '../../types'
import { ERR_INVALID_FILTER } from '../../constant'
import { getLoonNodeNames, getLoonNodes } from '../loon'

test('getLoonNodes AnyTLS', (t) => {
  t.is(
    getLoonNodes([
      {
        type: NodeTypeEnum.AnyTLS,
        nodeName: 'anytls',
        hostname: 'example.com',
        port: 8449,
        sni: 'example.com',
        password: 'password',
        udpRelay: true,
        skipCertVerify: true,
        blockQuic: 'on',
        idleSessionCheckInterval: 0,
        idleSessionTimeout: 0,
        minIdleSessions: 0,
        tfo: true,
      },
    ]),
    'anytls = AnyTLS,example.com,8449,"password",sni=example.com,skip-cert-verify=true,udp=true,block-quic=true,fast-open=true',
  )
  t.is(
    getLoonNodes([
      {
        type: NodeTypeEnum.AnyTLS,
        nodeName: 'anytls off',
        hostname: 'example.com',
        port: 8449,
        password: 'password',
        blockQuic: 'off',
      },
    ]),
    'anytls off = AnyTLS,example.com,8449,"password",block-quic=false',
  )
  t.is(
    getLoonNodes([
      {
        type: NodeTypeEnum.AnyTLS,
        nodeName: 'anytls defaults',
        hostname: 'example.com',
        port: 8449,
        password: 'password',
      },
    ]),
    'anytls defaults = AnyTLS,example.com,8449,"password"',
  )
})

test.serial('getLoonNodes AnyTLS omits automatic QUIC blocking', (t) => {
  const log = sinon
    .stub(transports.console, 'log')
    .callsFake((info, callback) => {
      t.is(info[Symbol.for('level')], 'warn')
      t.regex(
        info.message,
        /Loon 不支持 AnyTLS 节点 anytls auto 的 blockQuic=auto/,
      )
      callback()
    })

  try {
    t.is(
      getLoonNodes([
        {
          type: NodeTypeEnum.AnyTLS,
          nodeName: 'anytls auto',
          hostname: 'example.com',
          port: 8449,
          password: 'password',
          blockQuic: 'auto',
        },
      ]),
      'anytls auto = AnyTLS,example.com,8449,"password"',
    )
    t.true(log.calledOnce)
  } finally {
    log.restore()
  }
})

test('getLoonNodes', (t) => {
  t.is(
    getLoonNodes([
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
    '测试 = vmess,1.1.1.1,443,chacha20-poly1305,"1386f85e-657b-4d6e-9d56-78badb75e1fd",transport=tcp,over-tls=true,udp=true',
  )
  t.is(
    getLoonNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'http',
        nodeName: '测试',
        port: 443,
        tls: true,
        tls13: true,
        udpRelay: true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        httpOpts: {
          path: ['/test'],
          method: 'POST',
          headers: {
            Host: 'example.com',
          },
        },
      },
    ]),
    '测试 = vmess,1.1.1.1,443,chacha20-poly1305,"1386f85e-657b-4d6e-9d56-78badb75e1fd",transport=http,path=/test,host=example.com,over-tls=true,udp=true',
  )
  t.is(
    getLoonNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'ws',
        nodeName: '测试',
        port: 443,
        tls: true,
        tls13: true,
        udpRelay: true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        wsOpts: {
          path: '/test',
          headers: {},
        },
      },
    ]),
    '测试 = vmess,1.1.1.1,443,chacha20-poly1305,"1386f85e-657b-4d6e-9d56-78badb75e1fd",transport=ws,path=/test,over-tls=true,udp=true',
  )
  t.is(
    getLoonNodes([
      {
        type: NodeTypeEnum.Vless,
        nodeName: 'vless',
        hostname: 'server',
        port: 443,
        uuid: 'uuid',
        method: 'none',
        network: 'tcp',
        flow: 'flow',
        realityOpts: {
          publicKey: 'publicKey',
          shortId: 'shortId',
        },
        udpRelay: true,
        sni: 'sni',
        skipCertVerify: true,
      },
    ]),
    'vless = VLESS,server,443,"uuid",transport=tcp,flow=flow,public-key="publicKey",short-id=shortId,over-tls=true,sni=sni,skip-cert-verify=true,udp=true',
  )
  t.is(
    getLoonNodes([
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
    ]),
    '🇭🇰HK = ShadowsocksR,hk.example.com,10000,chacha20-ietf,"password",protocol=auth_aes128_md5,protocol-param=,obfs=tls1.2_ticket_auth,obfs-param=music.163.com',
  )
  t.is(
    getLoonNodes([
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
    'test = https,a.com,443,snsms,"nndndnd",sni=a.com,skip-cert-verify=false',
  )
  t.is(
    getLoonNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
      },
    ]),
    'trojan = trojan,example.com,443,"password1",sni=example.com,skip-cert-verify=false',
  )
  t.is(
    getLoonNodes([
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
    'trojan = trojan,example.com,443,"password1",sni=example.com,skip-cert-verify=true,fast-open=true,udp=true',
  )
  t.is(
    getLoonNodes([
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
    'trojan = trojan,example.com,443,"password1",sni=sni.example.com,skip-cert-verify=true,fast-open=true,udp=true',
  )
  t.is(
    getLoonNodes([
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
        },
      },
    ]),
    'trojan = trojan,example.com,443,"password1",sni=sni.example.com,skip-cert-verify=true,transport=ws,path=/ws,host=example.com,fast-open=true,udp=true',
  )
  t.is(
    getLoonNodes([
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
        dnsServers: ['1.1.1.1', '::1'],
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
    ]),
    [
      'wg node = wireguard,interface-ip=10.0.0.1,private-key="privateKey",mtu=1420,peers=[{public-key="publicKey",endpoint=wg.example.com:51820}]',
      'wg node = wireguard,interface-ip=10.0.0.1,private-key="privateKey",interface-ipV6=2001:db8:85a3::8a2e:370:7334,mtu=1420,dns=1.1.1.1,dnsV6=::1,keepalive=25,peers=[{public-key="publicKey",endpoint=wg.example.com:51820,allowed-ips="0.0.0.0/0",preshared-key="presharedKey"}]',
    ].join('\n'),
  )
})

test('getLoonNodes error', (t) => {
  t.throws(
    () => {
      getLoonNodes(
        [
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
        ],
        undefined,
      )
    },
    undefined,
    ERR_INVALID_FILTER,
  )
})

test('getLoonNodeNames', (t) => {
  t.is(
    getLoonNodeNames([
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
    ['Test Node 1, Test Node 2'].join(', '),
  )
})
