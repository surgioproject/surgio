// tslint:disable:no-expression-statement
import test from 'ava'

import {
  NodeTypeEnum,
  PossibleNodeConfigType,
  ShadowsocksNodeConfig,
} from '../../types'
import { fromBase64 } from '../index'
import * as utils from '../index'

test('getNodeNames', async (t) => {
  const nodeList: ReadonlyArray<PossibleNodeConfigType> = [
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
  ] as const
  const txt1 = utils.getNodeNames(nodeList)
  const txt2 = utils.getNodeNames(nodeList, undefined, ':')
  const txt3 = utils.getNodeNames(
    nodeList,
    (nodeConfig) => nodeConfig.nodeName !== 'Test Node 3',
  )

  t.is(txt1, 'Test Node 1, Test Node 3')
  t.is(txt2, 'Test Node 1:Test Node 3')
  t.is(txt3, 'Test Node 1')
})

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
      obfsHost: 'gateway.icloud.com',
      udpRelay: true,
    },
  ]
  const txt1 = utils.getShadowsocksNodes(nodeList, 'GroupName')

  t.is(
    txt1,
    'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@example.com:8443/?plugin=obfs-local%3Bobfs%3Dtls%3Bobfs-host%3Dgateway.icloud.com&group=GroupName#%F0%9F%87%AD%F0%9F%87%B0HK(Example)',
  )
})

test('getDownloadUrl', (t) => {
  t.is(
    utils.getDownloadUrl('http://example.com/', 'test.conf'),
    'http://example.com/test.conf',
  )
  t.is(utils.getDownloadUrl(undefined, 'test.conf'), '/test.conf')
  t.is(utils.getDownloadUrl(undefined, 'test.conf', false), '/test.conf?dl=1')
  t.is(
    utils.getDownloadUrl(undefined, 'test.conf', undefined, 'abcd'),
    '/test.conf?access_token=abcd',
  )
  t.is(
    utils.getDownloadUrl(
      'http://example.com/',
      'test.conf?foo=bar',
      undefined,
      'abcd',
    ),
    'http://example.com/test.conf?foo=bar&access_token=abcd',
  )
})

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
        port: 8080,
        tls: false,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        wsOpts: {
          path: '/',
          headers: {
            Host: 'example.com',
          },
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
        tls: true,
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
        tls: false,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        wsOpts: {
          path: '/',
          headers: {
            Host: 'example.com',
          },
        },
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'http',
        nodeName: '测试 4',
        port: 8080,
        tls: false,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        httpOpts: {
          path: ['/'],
          method: 'GET',
          headers: {
            Host: 'example.com',
          },
        },
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'h2',
        nodeName: '测试 5',
        port: 8080,
        tls: false,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        h2Opts: {
          path: '/',
          host: ['example.com'],
        },
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'grpc',
        nodeName: '测试 6',
        port: 8080,
        tls: false,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        grpcOpts: {
          serviceName: 'example',
        },
      },
    ])
    .split('\n')

  t.snapshot(fromBase64(schemeList[0].replace('vmess://', '')))
  t.snapshot(fromBase64(schemeList[1].replace('vmess://', '')))
  t.snapshot(fromBase64(schemeList[2].replace('vmess://', '')))
  t.snapshot(fromBase64(schemeList[3].replace('vmess://', '')))
  t.snapshot(fromBase64(schemeList[4].replace('vmess://', '')))
  t.snapshot(fromBase64(schemeList[5].replace('vmess://', '')))
})

test('isIp', (t) => {
  t.true(utils.isIp('0.0.0.0'))
  t.true(utils.isIp('255.255.255.255'))
  t.false(utils.isIp('256.256.256.256'))
  t.false(utils.isIp('example.com'))
})

test('parseBitrate', (t) => {
  t.is(utils.parseBitrate('1Kbps'), 0.001)
  t.is(utils.parseBitrate('1 Kbps'), 0.001)
  t.is(utils.parseBitrate('1 Mbps'), 1)
  t.is(utils.parseBitrate('1000 Kbps'), 1)
  t.is(utils.parseBitrate(1), 1)
  t.is(utils.parseBitrate(10), 10)
  t.is(utils.parseBitrate(100), 100)
})
