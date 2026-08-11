import test from 'ava'

import { NodeTypeEnum } from '../types'

import { MasqueNodeConfigValidator } from './masque'

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

test('validates MASQUE basic-auth nodes', (t) => {
  t.true(MasqueNodeConfigValidator.safeParse(basicAuthNode).success)
  t.true(
    MasqueNodeConfigValidator.safeParse({
      ...basicAuthNode,
      portHopping: '1234,5000-6000',
      portHoppingInterval: 30,
    }).success,
  )
})

test('rejects incompatible MASQUE basic-auth options', (t) => {
  t.false(
    MasqueNodeConfigValidator.safeParse({
      ...basicAuthNode,
      portHopping: '1234;5000-6000',
      underlyingProxy: 'upstream',
    }).success,
  )
  t.false(
    MasqueNodeConfigValidator.safeParse({
      ...basicAuthNode,
      shadowTls: {
        password: 'password',
        sni: 'example.com',
      },
    }).success,
  )
})

test('validates MASQUE key-pair nodes', (t) => {
  t.true(MasqueNodeConfigValidator.safeParse(keyPairNode).success)
  t.true(
    MasqueNodeConfigValidator.safeParse({
      ...keyPairNode,
      ip: undefined,
      network: 'h3-l4proxy',
      udpRelay: false,
    }).success,
  )
})

test('rejects invalid MASQUE key-pair nodes', (t) => {
  t.false(
    MasqueNodeConfigValidator.safeParse({
      ...keyPairNode,
      ip: undefined,
    }).success,
  )
  t.false(
    MasqueNodeConfigValidator.safeParse({
      ...keyPairNode,
      ip: undefined,
      network: 'h3-l4proxy',
      udpRelay: true,
    }).success,
  )
})
