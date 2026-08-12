import { expect, test } from 'vitest'

import { NodeTypeEnum } from '../types'

import { Hysteria2NodeConfigValidator } from './hysteria2'

test('Hysteria2NodeConfigValidator preserves udpRelay', () => {
  const result = Hysteria2NodeConfigValidator.parse({
    type: NodeTypeEnum.Hysteria2,
    nodeName: 'hysteria2',
    hostname: 'example.com',
    port: 443,
    password: 'password',
    udpRelay: true,
  })

  expect(result.udpRelay).toBe(true)
})
