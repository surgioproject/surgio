import { promises } from 'dns'
import { afterEach, expect, test, vi } from 'vitest'

import { resolveDomain } from '../dns.js'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
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
  vi.useFakeTimers()
  let finish:
    ((records: Array<{ address: string; ttl: number }>) => void) | undefined
  vi.spyOn(promises, 'resolve4').mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  vi.spyOn(promises, 'resolve6').mockResolvedValue([])

  const pending = resolveDomain('timeout.example.com', 100)
  await vi.advanceTimersByTimeAsync(100)
  await expect(pending).resolves.toEqual([])
  expect(vi.getTimerCount()).toBe(0)
  finish?.([{ address: '127.0.0.2', ttl: 1000 }])
  await vi.advanceTimersByTimeAsync(0)
  expect(vi.getTimerCount()).toBe(0)
})

test('clears the timeout when DNS finishes early', async () => {
  vi.useFakeTimers()
  vi.spyOn(promises, 'resolve4').mockResolvedValue([
    { address: '127.0.0.1', ttl: 100 },
  ])
  vi.spyOn(promises, 'resolve6').mockResolvedValue([
    { address: '::1', ttl: 100 },
  ])

  await expect(resolveDomain('early.example.com', 10_000)).resolves.toEqual([
    '127.0.0.1',
    '::1',
  ])
  expect(vi.getTimerCount()).toBe(0)
})

test('clears the timeout when both DNS queries fail', async () => {
  vi.useFakeTimers()
  vi.spyOn(promises, 'resolve4').mockRejectedValue(new Error('DNS unavailable'))
  vi.spyOn(promises, 'resolve6').mockRejectedValue(new Error('DNS unavailable'))

  await expect(resolveDomain('failed.example.com')).resolves.toEqual([])
  expect(vi.getTimerCount()).toBe(0)
})

test('coalesces concurrent resolutions for the same domain', async () => {
  let resolveIpv4:
    ((records: Array<{ address: string; ttl: number }>) => void) | undefined
  const resolve4 = vi.spyOn(promises, 'resolve4').mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveIpv4 = resolve
      }),
  )
  const resolve6 = vi.spyOn(promises, 'resolve6').mockResolvedValue([])

  const first = resolveDomain('concurrent.example.com')
  const second = resolveDomain('concurrent.example.com')
  await vi.waitFor(() => expect(resolve4).toHaveBeenCalledTimes(1))
  resolveIpv4?.([{ address: '127.0.0.3', ttl: 100 }])

  await expect(Promise.all([first, second])).resolves.toEqual([
    ['127.0.0.3'],
    ['127.0.0.3'],
  ])
  expect(resolve4).toHaveBeenCalledTimes(1)
  expect(resolve6).toHaveBeenCalledTimes(1)
})

test('queries the resolver again after an earlier resolution completes', async () => {
  const resolve4 = vi
    .spyOn(promises, 'resolve4')
    .mockResolvedValue([{ address: '127.0.0.4', ttl: 100 }])
  const resolve6 = vi.spyOn(promises, 'resolve6').mockResolvedValue([])

  await resolveDomain('repeated.example.com')
  await resolveDomain('repeated.example.com')

  expect(resolve4).toHaveBeenCalledTimes(2)
  expect(resolve6).toHaveBeenCalledTimes(2)
})
