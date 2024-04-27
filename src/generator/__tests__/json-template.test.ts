import test from 'ava'
import sinon from 'sinon'
import fs from 'fs-extra'

import {
  extendOutbounds,
  createExtendFunction,
  combineExtendFunctions,
  render,
} from '../json-template'

test.beforeEach(() => {
  sinon.restore()
})

test('extendOutbounds - extend string', (t) => {
  const extend = extendOutbounds('new-value')

  t.deepEqual(
    extend({
      foo: 'foo',
    }),
    {
      foo: 'foo',
      outbounds: 'new-value',
    },
  )
})

test('extendOutbounds - extend object', (t) => {
  const extend = extendOutbounds({
    bar: 'bar',
  })

  t.deepEqual(
    extend({
      foo: 'foo',
    }),
    {
      foo: 'foo',
      outbounds: {
        bar: 'bar',
      },
    },
  )
})

test('extendOutbounds - extend array', (t) => {
  const extendString = extendOutbounds('new-value')
  t.deepEqual(
    extendString({
      foo: 'foo',
      outbounds: ['old-value'],
    }),
    {
      foo: 'foo',
      outbounds: ['old-value', 'new-value'],
    },
  )

  const extendObject = extendOutbounds({
    bar: 'bar',
  })
  t.deepEqual(
    extendObject({
      outbounds: [
        {
          foo: 'foo',
        },
      ],
    }),
    {
      outbounds: [
        {
          foo: 'foo',
        },
        {
          bar: 'bar',
        },
      ],
    },
  )

  const extendArray = extendOutbounds(['new-value1', 'new-value2'])

  t.deepEqual(extendArray({ outbounds: ['old-value'] }), {
    outbounds: ['old-value', 'new-value1', 'new-value2'],
  })
})

test('extendOutbounds - extend function that returns object', (t) => {
  const spy = sinon.spy(() => {
    t.pass()
    return 'something'
  })
  const extend = extendOutbounds(({ getSomething }) => {
    return {
      bar: getSomething(),
    }
  })

  t.deepEqual(
    extend(
      {
        foo: 'foo',
      },
      {
        getSomething: spy,
      },
    ),
    {
      foo: 'foo',
      outbounds: {
        bar: 'something',
      },
    },
  )
  t.is(spy.calledOnce, true)
})

test('createExtendFunction - deep extend', (t) => {
  const extendFunction = createExtendFunction('foo.bar')
  const extend = extendFunction({
    bar: 'bar',
  })

  t.deepEqual(
    extend({
      foo: {
        baz: 'baz',
      },
    }),
    {
      foo: {
        baz: 'baz',
        bar: {
          bar: 'bar',
        },
      },
    },
  )
})

test('createExtendFunction - deep extend array', (t) => {
  const extendFunction = createExtendFunction('foo[0]')
  const extend = extendFunction({
    bar: 'bar',
  })

  t.deepEqual(
    extend({
      foo: [
        {
          baz: 'baz',
        },
      ],
    }),
    {
      foo: [
        {
          bar: 'bar',
        },
      ],
    },
  )
})

test('combineExtendFunctions', (t) => {
  const extend1 = createExtendFunction('foo')({ bar: 'bar' })
  const extend2 = createExtendFunction('baz')({ qux: 'qux' })

  const combined = combineExtendFunctions(extend1, extend2)

  t.deepEqual(
    combined({
      original: 'original',
    }),
    {
      original: 'original',
      foo: {
        bar: 'bar',
      },
      baz: {
        qux: 'qux',
      },
    },
  )
})

test('render', (t) => {
  sinon.stub(fs, 'readJsonSync').returns({
    foo: 'foo',
    bar: 'bar',
  })

  const result = render(
    'templateDir',
    'fileName',
    extendOutbounds('new-value'),
    { baz: 'baz' },
  )

  t.snapshot(result)
  t.true(
    (fs.readJsonSync as sinon.SinonStub).calledOnceWith('templateDir/fileName'),
  )
})
