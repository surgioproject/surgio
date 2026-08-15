import { expect, test } from 'vitest'

import * as index from '../index.js'

test('exports.utils', () => {
  expect(index.utils).toMatchSnapshot()
})

test('exports.categories', () => {
  expect(index.categories).toMatchSnapshot()
})

test('exports.define*', () => {
  const keys = Object.keys(index).filter((key) => key.startsWith('define'))

  expect(keys).toMatchSnapshot()
})
