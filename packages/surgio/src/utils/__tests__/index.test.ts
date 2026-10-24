// tslint:disable:no-expression-statement
import { expect, test } from 'vitest'

import {
  NodeTypeEnum,
  PossibleNodeConfigType,
  ShadowsocksNodeConfig,
} from '../../types.js'
import { fromBase64 } from '../index.js'
import * as utils from '../index.js'

test('getNodeNames', async () => {
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

  expect(txt1).toBe('Test Node 1, Test Node 3')
  expect(txt2).toBe('Test Node 1:Test Node 3')
  expect(txt3).toBe('Test Node 1')
})

test('getShadowsocksNodes', async () => {
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

  expect(txt1).toBe(
    'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@example.com:8443/?plugin=obfs-local%3Bobfs%3Dtls%3Bobfs-host%3Dgateway.icloud.com&group=GroupName#%F0%9F%87%AD%F0%9F%87%B0HK(Example)',
  )
})

test('getDownloadUrl', () => {
  expect(utils.getDownloadUrl('http://example.com/', 'test.conf')).toBe(
    'http://example.com/test.conf',
  )
  expect(utils.getDownloadUrl(undefined, 'test.conf')).toBe('/test.conf')
  expect(utils.getDownloadUrl(undefined, 'test.conf', false)).toBe(
    '/test.conf?dl=1',
  )
  expect(utils.getDownloadUrl(undefined, 'test.conf', undefined, 'abcd')).toBe(
    '/test.conf?access_token=abcd',
  )
  expect(
    utils.getDownloadUrl(
      'http://example.com/',
      'test.conf?foo=bar',
      undefined,
      'abcd',
    ),
  ).toBe('http://example.com/test.conf?foo=bar&access_token=abcd')
})

test('getV2rayNNodes', () => {
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

  expect(fromBase64(schemeList[0].replace('vmess://', ''))).toMatchSnapshot()
  expect(fromBase64(schemeList[1].replace('vmess://', ''))).toMatchSnapshot()
  expect(fromBase64(schemeList[2].replace('vmess://', ''))).toMatchSnapshot()
  expect(fromBase64(schemeList[3].replace('vmess://', ''))).toMatchSnapshot()
  expect(fromBase64(schemeList[4].replace('vmess://', ''))).toMatchSnapshot()
  expect(fromBase64(schemeList[5].replace('vmess://', ''))).toMatchSnapshot()
})

test('isIp', () => {
  expect(utils.isIp('0.0.0.0')).toBe(true)
  expect(utils.isIp('255.255.255.255')).toBe(true)
  expect(utils.isIp('256.256.256.256')).toBe(false)
  expect(utils.isIp('example.com')).toBe(false)
})

test('parseBitrate', () => {
  expect(utils.parseBitrate('1Kbps')).toBe(0.001)
  expect(utils.parseBitrate('1 Kbps')).toBe(0.001)
  expect(utils.parseBitrate('1 Mbps')).toBe(1)
  expect(utils.parseBitrate('1000 Kbps')).toBe(1)
  expect(utils.parseBitrate(1)).toBe(1)
  expect(utils.parseBitrate(10)).toBe(10)
  expect(utils.parseBitrate(100)).toBe(100)
})
