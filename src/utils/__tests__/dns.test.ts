import { promises } from 'dns'
import { afterEach, expect, test, vi } from 'vitest'
import Bluebird from 'bluebird'

import { resolveDomain } from '../dns.js'

afterEach(() => {
  vi.restoreAllMocks()
})

test('resolveDomain ipv4', async () => {
  vi.spyOn(promises, 'resolve4').mockImplementation(async () => {
    return [{ address: '127.0.0.1', ttl: 100 }]
  })
  vi.spyOn(promises, 'resolve6').mockImplementation(async () => {
    return []
  })

  const ips = await resolveDomain('ipv4.example.com')
  expect(ips[0]).toBe('127.0.0.1')
})

test('resolveDomain ipv6', async () => {
  vi.spyOn(promises, 'resolve4').mockImplementation(async () => {
    return []
  })
  vi.spyOn(promises, 'resolve6').mockImplementation(async () => {
    return [{ address: '::1', ttl: 100 }]
  })

  const ips = await resolveDomain('ipv6.example.com')
  expect(ips[0]).toBe('::1')
})

test('resolveDomain timeout', async () => {
  vi.spyOn(promises, 'resolve4').mockImplementation(async () => {
    await Bluebird.delay(1000)
    return [{ address: '127.0.0.2', ttl: 1000 }]
  })
  vi.spyOn(promises, 'resolve6').mockImplementation(async () => {
    await Bluebird.delay(1000)
    return [{ address: '::2', ttl: 1000 }]
  })

  const ips = await resolveDomain('timeout.example.com', 0)
  expect(ips.length).toBe(0)
})
