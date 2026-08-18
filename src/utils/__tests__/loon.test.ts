import { expect, test, vi } from 'vitest'

import { NodeTypeEnum } from '../../types.js'
import { ERR_INVALID_FILTER } from '../../constant/index.js'
import { getLoonNodeNames, getLoonNodes } from '../loon.js'

test('getLoonNodes Hysteria2', () => {
  expect(
    getLoonNodes([
      {
        type: NodeTypeEnum.Hysteria2,
        nodeName: 'hysteria2',
        hostname: 'example.com',
        port: 9898,
        password: 'pa"ssword',
        sni: 'sni.example.com',
        skipCertVerify: true,
        tfo: true,
        obfs: 'salamander',
        obfsPassword: 'obfs"password',
        udpRelay: true,
        downloadBandwidth: 100,
        uploadBandwidth: 50,
        portHopping: '5000-6000',
        portHoppingInterval: 10,
        alpn: ['h3'],
      },
    ]),
  ).toBe(
    'hysteria2 = Hysteria2,example.com,9898,"pa\\"ssword",sni=sni.example.com,skip-cert-verify=true,fast-open=true,salamander-password="obfs\\"password",udp=true',
  )

  expect(
    getLoonNodes([
      {
        type: NodeTypeEnum.Hysteria2,
        nodeName: 'hysteria2 minimal',
        hostname: 'example.com',
        port: 443,
        password: 'password',
      },
    ]),
  ).toBe('hysteria2 minimal = Hysteria2,example.com,443,"password"')
})

test('getLoonNodes AnyTLS', () => {
  expect(
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
  ).toBe(
    'anytls = AnyTLS,example.com,8449,"password",sni=example.com,skip-cert-verify=true,udp=true,block-quic=true,fast-open=true',
  )
  expect(
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
  ).toBe('anytls off = AnyTLS,example.com,8449,"password",block-quic=false')
  expect(
    getLoonNodes([
      {
        type: NodeTypeEnum.AnyTLS,
        nodeName: 'anytls defaults',
        hostname: 'example.com',
        port: 8449,
        password: 'password',
      },
    ]),
  ).toBe('anytls defaults = AnyTLS,example.com,8449,"password"')
})

test('getLoonNodes AnyTLS omits automatic QUIC blocking', () => {
  const warn = vi.fn()
  const logger = { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() }

  expect(
    getLoonNodes(
      [
        {
          type: NodeTypeEnum.AnyTLS,
          nodeName: 'anytls auto',
          hostname: 'example.com',
          port: 8449,
          password: 'password',
          blockQuic: 'auto',
        },
      ],
      undefined,
      { logger },
    ),
  ).toBe('anytls auto = AnyTLS,example.com,8449,"password"')
  expect(warn).toHaveBeenCalledOnce()
  expect(warn).toHaveBeenCalledWith(
    'Loon 不支持 AnyTLS 节点 anytls auto 的 blockQuic=auto，将省略 block-quic 参数',
  )
})

test('getLoonNodes', () => {
  expect(
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
  ).toBe(
    '测试 = vmess,1.1.1.1,443,chacha20-poly1305,"1386f85e-657b-4d6e-9d56-78badb75e1fd",transport=tcp,over-tls=true,udp=true',
  )
  expect(
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
  ).toBe(
    '测试 = vmess,1.1.1.1,443,chacha20-poly1305,"1386f85e-657b-4d6e-9d56-78badb75e1fd",transport=http,path=/test,host=example.com,over-tls=true,udp=true',
  )
  expect(
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
  ).toBe(
    '测试 = vmess,1.1.1.1,443,chacha20-poly1305,"1386f85e-657b-4d6e-9d56-78badb75e1fd",transport=ws,path=/test,over-tls=true,udp=true',
  )
  expect(
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
  ).toBe(
    'vless = VLESS,server,443,"uuid",transport=tcp,flow=flow,public-key="publicKey",short-id=shortId,over-tls=true,sni=sni,skip-cert-verify=true,udp=true',
  )
  expect(
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
  ).toBe(
    '🇭🇰HK = ShadowsocksR,hk.example.com,10000,chacha20-ietf,"password",protocol=auth_aes128_md5,protocol-param=,obfs=tls1.2_ticket_auth,obfs-param=music.163.com',
  )
  expect(
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
  ).toBe(
    'test = https,a.com,443,snsms,"nndndnd",sni=a.com,skip-cert-verify=false',
  )
  expect(
    getLoonNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
      },
    ]),
  ).toBe(
    'trojan = trojan,example.com,443,"password1",sni=example.com,skip-cert-verify=false',
  )
  expect(
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
  ).toBe(
    'trojan = trojan,example.com,443,"password1",sni=example.com,skip-cert-verify=true,fast-open=true,udp=true',
  )
  expect(
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
  ).toBe(
    'trojan = trojan,example.com,443,"password1",sni=sni.example.com,skip-cert-verify=true,fast-open=true,udp=true',
  )
  expect(
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
  ).toBe(
    'trojan = trojan,example.com,443,"password1",sni=sni.example.com,skip-cert-verify=true,transport=ws,path=/ws,host=example.com,fast-open=true,udp=true',
  )
  expect(
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
  ).toBe(
    [
      'wg node = wireguard,interface-ip=10.0.0.1,private-key="privateKey",mtu=1420,peers=[{public-key="publicKey",endpoint=wg.example.com:51820}]',
      'wg node = wireguard,interface-ip=10.0.0.1,private-key="privateKey",interface-ipV6=2001:db8:85a3::8a2e:370:7334,mtu=1420,dns=1.1.1.1,dnsV6=::1,keepalive=25,peers=[{public-key="publicKey",endpoint=wg.example.com:51820,allowed-ips="0.0.0.0/0",preshared-key="presharedKey"}]',
    ].join('\n'),
  )
})

test('getLoonNodes error', () => {
  expect(() => {
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
  }).toThrow(ERR_INVALID_FILTER)
})

test('getLoonNodeNames', () => {
  expect(
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
      {
        nodeName: 'Hysteria 2',
        type: NodeTypeEnum.Hysteria2,
        hostname: 'hysteria.example.com',
        port: 443,
        password: 'password',
      },
    ]),
  ).toBe(['Test Node 1, Test Node 2, Hysteria 2'].join(', '))
})
