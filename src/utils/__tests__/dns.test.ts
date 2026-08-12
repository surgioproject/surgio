import { promises } from 'dns'
import { afterEach, expect, test } from 'vitest'
import Bluebird from 'bluebird'
import sinon, { SinonStub } from 'sinon'

import { resolveDomain } from '../dns'

const sandbox = sinon.createSandbox()

afterEach(() => {
  sandbox.restore()
})

test('resolveDomain ipv4', async () => {
  sandbox.stub(promises, 'resolve4').callsFake(async () => {
    return [{ address: '127.0.0.1', ttl: 100 }]
  })
  sandbox.stub(promises, 'resolve6').callsFake(async () => {
    return []
  })

  const ips = await resolveDomain('ipv4.example.com')
  expect(ips[0]).toBe('127.0.0.1')
  ;(promises.resolve4 as SinonStub).restore()
  ;(promises.resolve6 as SinonStub).restore()
})

test('resolveDomain ipv6', async () => {
  sandbox.stub(promises, 'resolve4').callsFake(async () => {
    return []
  })
  sandbox.stub(promises, 'resolve6').callsFake(async () => {
    return [{ address: '::1', ttl: 100 }]
  })

  const ips = await resolveDomain('ipv6.example.com')
  expect(ips[0]).toBe('::1')
  ;(promises.resolve4 as SinonStub).restore()
  ;(promises.resolve6 as SinonStub).restore()
})

test('resolveDomain timeout', async () => {
  sandbox.stub(promises, 'resolve4').callsFake(async () => {
    await Bluebird.delay(1000)
    return [{ address: '127.0.0.2', ttl: 1000 }]
  })
  sandbox.stub(promises, 'resolve6').callsFake(async () => {
    await Bluebird.delay(1000)
    return [{ address: '::2', ttl: 1000 }]
  })

  const ips = await resolveDomain('timeout.example.com', 0)
  expect(ips.length).toBe(0)
  ;(promises.resolve4 as SinonStub).restore()
  ;(promises.resolve6 as SinonStub).restore()
})
