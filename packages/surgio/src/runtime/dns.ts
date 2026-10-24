import { promises as dns } from 'node:dns'

import type { RuntimeDomainResolver } from './types.js'

export const coalesceAsync = <T>(
  operation: (key: string) => Promise<T>,
): ((key: string) => Promise<T>) => {
  const inFlight = new Map<string, Promise<T>>()

  return (key) => {
    const existing = inFlight.get(key)
    if (existing) return existing

    const pending = operation(key)
    inFlight.set(key, pending)
    const removePending = () => {
      if (inFlight.get(key) === pending) inFlight.delete(key)
    }
    void pending.then(removePending, removePending)
    return pending
  }
}

const resolveOnce = coalesceAsync((domain: string) =>
  Promise.all([
    dns.resolve4(domain).catch(() => []),
    dns.resolve6(domain).catch(() => []),
  ]).then(([ipv4, ipv6]) => [...ipv4, ...ipv6]),
)

export const createDefaultDomainResolver =
  (): RuntimeDomainResolver =>
  async (domain, timeout = 10_000) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      return await Promise.race([
        resolveOnce(domain),
        new Promise<ReadonlyArray<string>>((resolve) => {
          timer = setTimeout(() => resolve([]), timeout)
        }),
      ])
    } finally {
      if (timer) clearTimeout(timer)
    }
  }
