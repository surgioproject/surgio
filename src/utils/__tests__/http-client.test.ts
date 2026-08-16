import { expect, test, vi } from 'vitest'

import { createDefaultHttpClient, getUserAgent } from '../http-client.js'

test('getUserAgent', () => {
  const pkg = require('../../../package.json')
  expect(getUserAgent()).toBe('surgio/' + pkg.version)
  expect(getUserAgent('foo')).toBe('foo surgio/' + pkg.version)
})

test('httpClient sends the Surgio user agent', async () => {
  const pkg = require('../../../package.json')
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('ok'))
  const httpClient = createDefaultHttpClient(fetchMock)

  await httpClient.get('https://example.com')

  expect(
    (fetchMock.mock.calls[0][0] as Request).headers.get('user-agent'),
  ).toBe('surgio/' + pkg.version)
})
