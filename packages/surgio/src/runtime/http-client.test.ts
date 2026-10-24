import { describe, expect, test, vi } from 'vitest'
import { TimeoutError } from 'ky'

import packageJson from '../../package.json' with { type: 'json' }

import { createHttpClient } from './http-client.js'

describe('HTTP client', () => {
  test('calls an injected fetch with the global receiver', async () => {
    const fetchMock = vi.fn(async function (this: unknown) {
      if (this !== globalThis) {
        throw new TypeError('Illegal invocation')
      }
      return new Response('ok')
    }) as unknown as typeof fetch
    const client = createHttpClient({ fetch: fetchMock, retry: 0 })

    await expect(client.get('https://example.com/data')).resolves.toMatchObject(
      {
        body: 'ok',
        statusCode: 200,
      },
    )
  })

  test('sends the Surgio user agent by default', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('ok'))
    const client = createHttpClient({ fetch: fetchMock })

    await client.get('https://example.com/data')

    expect(
      (fetchMock.mock.calls[0][0] as Request).headers.get('user-agent'),
    ).toBe(`surgio/${packageJson.version}`)
  })

  test('forwards headers and retries a failed response', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
      .mockResolvedValueOnce(
        new Response('ok', { headers: { 'x-result': 'ready' } }),
      )
    const client = createHttpClient({ fetch: fetchMock, retry: 1 })

    const response = await client.get('https://example.com/data', {
      headers: { 'x-test': 'value' },
    })

    expect(response).toMatchObject({
      body: 'ok',
      statusCode: 200,
      headers: { 'x-result': 'ready' },
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect((fetchMock.mock.calls[0][0] as Request).headers.get('x-test')).toBe(
      'value',
    )
  })

  test('aborts requests after the configured timeout', async () => {
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const request = input as Request
      return new Promise((_resolve, reject) => {
        request.signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    })
    const client = createHttpClient({
      fetch: fetchMock,
      retry: 0,
      timeout: 1,
    })

    await expect(client.get('https://example.com/slow')).rejects.toBeInstanceOf(
      TimeoutError,
    )
  })
})
