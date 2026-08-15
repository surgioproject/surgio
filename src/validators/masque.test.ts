import { expect, test } from 'vitest'

import { NodeTypeEnum } from '../types.js'

import { MasqueNodeConfigValidator } from './masque.js'

const basicAuthNode = {
  type: NodeTypeEnum.Masque,
  authMode: 'basic-auth',
  nodeName: 'MASQUE',
  hostname: 'masque.example.com',
  port: 443,
} as const

const keyPairNode = {
  type: NodeTypeEnum.Masque,
  authMode: 'key-pair',
  nodeName: 'WARP MASQUE',
  hostname: 'masque.example.com',
  port: 443,
  privateKey: 'private-key',
  publicKey: 'public-key',
  ip: '172.16.0.2/32',
} as const

test('validates MASQUE basic-auth nodes', () => {
  expect(MasqueNodeConfigValidator.safeParse(basicAuthNode).success).toBe(true)
  expect(
    MasqueNodeConfigValidator.safeParse({
      ...basicAuthNode,
      portHopping: '1234,5000-6000',
      portHoppingInterval: 30,
    }).success,
  ).toBe(true)
})

test('rejects incompatible MASQUE basic-auth options', () => {
  expect(
    MasqueNodeConfigValidator.safeParse({
      ...basicAuthNode,
      portHopping: '1234;5000-6000',
      underlyingProxy: 'upstream',
    }).success,
  ).toBe(false)
  expect(
    MasqueNodeConfigValidator.safeParse({
      ...basicAuthNode,
      shadowTls: {
        password: 'password',
        sni: 'example.com',
      },
    }).success,
  ).toBe(false)
})

test('validates MASQUE key-pair nodes', () => {
  expect(MasqueNodeConfigValidator.safeParse(keyPairNode).success).toBe(true)
  expect(
    MasqueNodeConfigValidator.safeParse({
      ...keyPairNode,
      ip: undefined,
      network: 'h3-l4proxy',
      udpRelay: false,
    }).success,
  ).toBe(true)
})

test('rejects invalid MASQUE key-pair nodes', () => {
  expect(
    MasqueNodeConfigValidator.safeParse({
      ...keyPairNode,
      ip: undefined,
    }).success,
  ).toBe(false)
  expect(
    MasqueNodeConfigValidator.safeParse({
      ...keyPairNode,
      ip: undefined,
      network: 'h3-l4proxy',
      udpRelay: true,
    }).success,
  ).toBe(false)
})
