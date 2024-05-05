import { promises } from 'dns'
import test from 'ava'
import Bluebird from 'bluebird'
import sinon, { SinonStub } from 'sinon'

import { resolveDomain } from '../dns'

const sandbox = sinon.createSandbox()

test.afterEach(() => {
  sandbox.restore()
})

test.serial('resolveDomain ipv4', async (t) => {
  sandbox.stub(promises, 'resolve4').callsFake(async () => {
    return [{ address: '127.0.0.1', ttl: 100 }]
  })
  sandbox.stub(promises, 'resolve6').callsFake(async () => {
    return []
  })

  const ips = await resolveDomain('ipv4.example.com')
  t.is(ips[0], '127.0.0.1')
  ;(promises.resolve4 as SinonStub).restore()
  ;(promises.resolve6 as SinonStub).restore()
})

test.serial('resolveDomain ipv6', async (t) => {
  sandbox.stub(promises, 'resolve4').callsFake(async () => {
    return []
  })
  sandbox.stub(promises, 'resolve6').callsFake(async () => {
    return [{ address: '::1', ttl: 100 }]
  })

  const ips = await resolveDomain('ipv6.example.com')
  t.is(ips[0], '::1')
  ;(promises.resolve4 as SinonStub).restore()
  ;(promises.resolve6 as SinonStub).restore()
})

test.serial('resolveDomain timeout', async (t) => {
  sandbox.stub(promises, 'resolve4').callsFake(async () => {
    await Bluebird.delay(1000)
    return [{ address: '127.0.0.2', ttl: 1000 }]
  })
  sandbox.stub(promises, 'resolve6').callsFake(async () => {
    await Bluebird.delay(1000)
    return [{ address: '::2', ttl: 1000 }]
  })

  const ips = await resolveDomain('timeout.example.com', 0)
  t.is(ips.length, 0)
  ;(promises.resolve4 as SinonStub).restore()
  ;(promises.resolve6 as SinonStub).restore()
})
