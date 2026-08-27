import test from 'ava'

import { NodeTypeEnum } from '../types'

import { TrustTunnelNodeConfigValidator } from './trust-tunnel'

const h2Node = {
  type: NodeTypeEnum.TrustTunnel,
  nodeName: 'TrustTunnel',
  hostname: 'trust.example.com',
  port: 443,
  username: 'user',
  password: 'pass',
} as const

test('validates TrustTunnel HTTP/2 and QUIC nodes', (t) => {
  t.true(TrustTunnelNodeConfigValidator.safeParse(h2Node).success)
  t.true(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      alpn: ['h2'],
      maxStreams: 3,
      shadowTls: {
        password: 'shadow-password',
        sni: 'shadow.example.com',
      },
    }).success,
  )
  t.true(
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
  )
})

test('rejects TrustTunnel transport option mismatches', (t) => {
  t.false(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      alpn: ['h3'],
    }).success,
  )
  t.false(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      quic: true,
      alpn: ['h2'],
    }).success,
  )
  t.false(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      portHopping: '443,8443',
    }).success,
  )
  t.false(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      congestionController: 'bbr',
    }).success,
  )
  t.false(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      quic: true,
      shadowTls: {
        password: 'shadow-password',
        sni: 'shadow.example.com',
      },
    }).success,
  )
})

test('rejects conflicting or invalid TrustTunnel reuse options', (t) => {
  t.false(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      maxConnections: 8,
      maxStreams: 16,
    }).success,
  )
  t.false(
    TrustTunnelNodeConfigValidator.safeParse({
      ...h2Node,
      minStreams: -1,
    }).success,
  )
})
