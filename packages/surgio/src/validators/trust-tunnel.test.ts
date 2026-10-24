import { expect, test } from 'vitest'

import { NodeTypeEnum } from '../types.js'

import { TrustTunnelNodeConfigValidator } from './trust-tunnel.js'

const h2Node = {
  type: NodeTypeEnum.TrustTunnel,
  nodeName: 'TrustTunnel',
  hostname: 'trust.example.com',
  port: 443,
  username: 'user',
  password: 'pass',
} as const

test('validates TrustTunnel HTTP/2 and QUIC nodes', () => {
  expect(TrustTunnelNodeConfigValidator.safeParse(h2Node).success).toBe(true)
  expect(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      alpn: ['h2'],
      maxStreams: 3,
      shadowTls: {
        password: 'shadow-password',
        sni: 'shadow.example.com',
      },
    }).success,
  ).toBe(true)
  expect(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      quic: true,
      alpn: ['h3'],
      portHopping: '443,8443,5000-6000',
      portHoppingInterval: 30,
      congestionController: 'bbr',
      bbrProfile: 'aggressive',
      maxConnections: 8,
      minStreams: 5,
    }).success,
  ).toBe(true)
})

test('rejects TrustTunnel transport option mismatches', () => {
  expect(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      alpn: ['h3'],
    }).success,
  ).toBe(false)
  expect(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      quic: true,
      alpn: ['h2'],
    }).success,
  ).toBe(false)
  expect(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      portHopping: '443,8443',
    }).success,
  ).toBe(false)
  expect(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      congestionController: 'bbr',
    }).success,
  ).toBe(false)
  expect(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      quic: true,
      shadowTls: {
        password: 'shadow-password',
        sni: 'shadow.example.com',
      },
    }).success,
  ).toBe(false)
})

test('rejects conflicting or invalid TrustTunnel reuse options', () => {
  expect(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      maxConnections: 8,
      maxStreams: 16,
    }).success,
  ).toBe(false)
  expect(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      minStreams: -1,
    }).success,
  ).toBe(false)
})
