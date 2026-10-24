import { expect, test } from 'vitest'

import { NodeTypeEnum } from '../types.js'

import { AnyTLSNodeConfigValidator } from './anytls.js'

const baseNode = {
  type: NodeTypeEnum.AnyTLS,
  nodeName: 'anytls',
  hostname: 'example.com',
  port: 443,
  password: 'password',
}

test('AnyTLSNodeConfigValidator accepts non-negative session settings', () => {
  expect(
    AnyTLSNodeConfigValidator.parse({
      ...baseNode,
      idleSessionCheckInterval: 0,
      idleSessionTimeout: 30,
      minIdleSessions: 0,
    }),
  ).toMatchObject({
    idleSessionCheckInterval: 0,
    idleSessionTimeout: 30,
    minIdleSessions: 0,
  })
})

test('AnyTLSNodeConfigValidator rejects invalid session settings', () => {
  expect(() =>
    AnyTLSNodeConfigValidator.parse({
      ...baseNode,
      idleSessionTimeout: -1,
    }),
  ).toThrow()
  expect(() =>
    AnyTLSNodeConfigValidator.parse({
      ...baseNode,
      minIdleSessions: 0.5,
    }),
  ).toThrow()
})
