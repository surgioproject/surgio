import { expect, test } from 'vitest'

import { NodeTypeEnum } from '../types.js'

import { TailscaleNodeConfigValidator } from './tailscale.js'

test('TailscaleNodeConfigValidator accepts the documented field union', () => {
  const result = TailscaleNodeConfigValidator.parse({
    type: NodeTypeEnum.Tailscale,
    nodeName: 'tailnet',
    authKey: 'tskey-auth-example',
    hostname: 'surgio-node',
    controlUrl: 'https://controlplane.tailscale.com',
    exitNode: '100.64.0.1',
    ephemeral: false,
    stateDir: './tailscale',
    udpRelay: false,
    acceptRoutes: true,
    exitNodeAllowLanAccess: false,
    routingMark: 0,
    derpOnly: false,
    idleKeepalive: -1,
    preferIpv6: false,
    dnsServers: ['100.100.100.100', '[fd7a:115c:a1e0::53]:53'],
    mtu: 1280,
    noErrorAlert: false,
    underlyingProxy: 'DIRECT',
    interfaceName: 'WLAN',
    ipVersion: 'ipv4-prefer',
    ecn: false,
    testUrl: 'http://100.64.0.1/',
    testTimeout: 5,
  })

  expect(result.type).toBe(NodeTypeEnum.Tailscale)
  expect(result.ephemeral!).toBe(false)
  expect(result.routingMark).toBe(0)
  expect(result.idleKeepalive).toBe(-1)
})

test('TailscaleNodeConfigValidator keeps authKey optional', () => {
  expect(
    TailscaleNodeConfigValidator.safeParse({
      type: NodeTypeEnum.Tailscale,
      nodeName: 'interactive-login',
    }).success,
  ).toBe(true)
})

test('TailscaleNodeConfigValidator accepts numeric boundaries', () => {
  for (const fields of [
    { mtu: 576, routingMark: 0 },
    { mtu: 1420, routingMark: 0xffff_ffff },
  ]) {
    expect(
      TailscaleNodeConfigValidator.safeParse({
        type: NodeTypeEnum.Tailscale,
        nodeName: 'tailnet',
        ...fields,
      }).success,
    ).toBe(true)
  }
})

test('TailscaleNodeConfigValidator rejects invalid constrained fields', () => {
  const base = {
    type: NodeTypeEnum.Tailscale,
    nodeName: 'tailnet',
  }

  for (const invalidFields of [
    { controlUrl: 'not-a-url' },
    { ipVersion: 'invalid' },
    { mtu: 575 },
    { mtu: 1421 },
    { routingMark: -1 },
    { routingMark: 0x1_0000_0000 },
    { dnsServers: [] },
    { hostname: '' },
    { authKey: '' },
    { exitNode: '' },
    { stateDir: '' },
  ]) {
    expect(
      TailscaleNodeConfigValidator.safeParse({
        ...base,
        ...invalidFields,
      }).success,
    ).toBe(false)
  }
})
