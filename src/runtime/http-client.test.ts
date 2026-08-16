import { describe, expect, test, vi } from 'vitest'
import { TimeoutError } from 'ky'

import { createHttpClient } from './http-client.js'

describe('HTTP client', () => {
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
