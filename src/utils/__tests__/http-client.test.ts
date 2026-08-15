import { expect, test } from 'vitest'

import httpClient, { getUserAgent } from '../http-client.js'

test('getUserAgent', () => {
  const pkg = require('../../../package.json')
  expect(getUserAgent()).toBe('surgio/' + pkg.version)
  expect(getUserAgent('foo')).toBe('foo surgio/' + pkg.version)
})

test('httpClient', () => {
  const pkg = require('../../../package.json')
  expect(httpClient.defaults.options.headers['user-agent']).toBe(
    'surgio/' + pkg.version,
  )
})
