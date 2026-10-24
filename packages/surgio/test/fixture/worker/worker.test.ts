/// <reference types="@cloudflare/vitest-pool-workers/types" />

import { SELF } from 'cloudflare:test'
import { describe, expect, test } from 'vitest'

describe('Surgio Worker fixture', () => {
  test('reads a Worker text binding through env()', async () => {
    const response = await SELF.fetch('https://example.com/environment')
    expect(await response.text()).toBe('worker-value')
  })

  test('persists Buffer and object values in a real KV binding', async () => {
    const response = await SELF.fetch('https://example.com/cache')
    expect(await response.json()).toEqual({
      buffer: { type: 'Buffer', data: [119, 111, 114, 107, 101, 114] },
      falsy: false,
    })
  })

  test('fetches a Provider and renders an artifact with a remote snippet', async () => {
    const response = await SELF.fetch('https://example.com/artifact')
    expect(await response.text()).toContain(
      'Worker Demo\nDOMAIN,example.com,Proxy',
    )
    expect(response.headers.get('subscription-userinfo')).toContain('total=100')
  })
})

test('renders Surfboard protocols and WireGuard sections in workerd', async () => {
  const response = await SELF.fetch('https://example.com/surfboard')
  expect(response.status).toBe(200)
  const body = await response.text()
  expect(body).toContain('wg = wireguard, section-name=wg')
  expect(body).toContain(
    'anytls = anytls, example.com, 443, password=secret, reuse=false, udp-relay=false',
  )
  expect(body).toContain('tuic = tuic-v5, example.com, 443')
  expect(body).toContain('obfs=http, obfs-uri=/obfs, udp-relay=true')
  expect(body).toContain(
    'gecko-global = hysteria2, example.com, 443, password=secret, gecko-password=global-gecko',
  )
  expect(body).toContain(
    'gecko-node = hysteria2, example.com, 443, password=secret, gecko-password=node-gecko',
  )
  expect(body).toContain(
    'Proxy = select, wg, anytls, tuic, snell, gecko-global, gecko-node',
  )
  expect(body).toContain('[WireGuard wg]\nprivate-key=private=')
  expect(body).toContain(
    'endpoint=[2001:db8::1]:51820, preshared-key=shared=, keepalive=0',
  )
})
