import test from 'ava'

import * as index from '../'

test('exports.utils', (t) => {
  t.snapshot(index.utils)
})

test('exports.categories', (t) => {
  t.snapshot(index.categories)
})

test('exports.define*', (t) => {
  const keys = Object.keys(index).filter((key) => key.startsWith('define'))

  t.snapshot(keys)
})
