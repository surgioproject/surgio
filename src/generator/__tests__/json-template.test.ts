import { expect, test, vi } from 'vitest'

import {
  extendOutbounds,
  createExtendFunction,
  combineExtendFunctions,
} from '../json-extend.js'

test('extendOutbounds - extend string', () => {
  const extend = extendOutbounds('new-value')

  expect(
    extend({
      foo: 'foo',
    }),
  ).toEqual({
    foo: 'foo',
    outbounds: 'new-value',
  })
})

test('extendOutbounds - extend object', () => {
  const extend = extendOutbounds({
    bar: 'bar',
  })

  expect(
    extend({
      foo: 'foo',
    }),
  ).toEqual({
    foo: 'foo',
    outbounds: {
      bar: 'bar',
    },
  })
})

test('extendOutbounds - extend array', () => {
  const extendString = extendOutbounds('new-value')
  expect(
    extendString({
      foo: 'foo',
      outbounds: ['old-value'],
    }),
  ).toEqual({
    foo: 'foo',
    outbounds: ['old-value', 'new-value'],
  })

  const extendObject = extendOutbounds({
    bar: 'bar',
  })
  expect(
    extendObject({
      outbounds: [
        {
          foo: 'foo',
        },
      ],
    }),
  ).toEqual({
    outbounds: [
      {
        foo: 'foo',
      },
      {
        bar: 'bar',
      },
    ],
  })

  const extendArray = extendOutbounds(['new-value1', 'new-value2'])

  expect(extendArray({ outbounds: ['old-value'] })).toEqual({
    outbounds: ['old-value', 'new-value1', 'new-value2'],
  })
})

test('extendOutbounds - extend function that returns object', () => {
  const spy = vi.fn(() => {
    expect(true).toBe(true)
    return 'something'
  })
  const extend = extendOutbounds(({ getSomething }) => {
    return {
      bar: getSomething(),
    }
  })

  expect(
    extend(
      {
        foo: 'foo',
      },
      {
        getSomething: spy,
      },
    ),
  ).toEqual({
    foo: 'foo',
    outbounds: {
      bar: 'something',
    },
  })
  expect(spy).toHaveBeenCalledOnce()
})

test('createExtendFunction - deep extend', () => {
  const extendFunction = createExtendFunction('foo.bar')
  const extend = extendFunction({
    bar: 'bar',
  })

  expect(
    extend({
      foo: {
        baz: 'baz',
      },
    }),
  ).toEqual({
    foo: {
      baz: 'baz',
      bar: {
        bar: 'bar',
      },
    },
  })
})

test('createExtendFunction - deep extend array', () => {
  const extendFunction = createExtendFunction('foo[0]')
  const extend = extendFunction({
    bar: 'bar',
  })

  expect(
    extend({
      foo: [
        {
          baz: 'baz',
        },
      ],
    }),
  ).toEqual({
    foo: [
      {
        baz: 'baz',
        bar: 'bar',
      },
    ],
  })
})

test('createExtendFunction - deep merge object', () => {
  const extendDNS = createExtendFunction('dns')
  const extend = extendDNS({
    nameserver: ['1.1.1.1'],
  })

  expect(
    extend({
      dns: {
        nameserver: ['1.0.0.1'],
        strategy: 'prefer_ipv6',
      },
    }),
  ).toEqual({
    dns: {
      nameserver: ['1.0.0.1', '1.1.1.1'],
      strategy: 'prefer_ipv6',
    },
  })
})

test('combineExtendFunctions', () => {
  const extend1 = createExtendFunction('foo')({ bar: 'bar' })
  const extend2 = createExtendFunction('baz')({ qux: 'qux' })

  const combined = combineExtendFunctions(extend1, extend2)

  expect(
    combined({
      original: 'original',
    }),
  ).toEqual({
    original: 'original',
    foo: {
      bar: 'bar',
    },
    baz: {
      qux: 'qux',
    },
  })
})
