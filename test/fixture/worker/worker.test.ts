/// <reference types="@cloudflare/vitest-pool-workers/types" />

import { SELF } from 'cloudflare:test'
import { describe, expect, test } from 'vitest'

describe('Surgio Worker fixture', () => {
  test('persists Buffer and object values in a real KV binding', async () => {
    const response = await SELF.fetch('https://example.com/cache')
    expect(await response.json()).toEqual({
      buffer: { type: 'Buffer', data: [119, 111, 114, 107, 101, 114] },
      falsy: false,
    })
  })

  test('fetches a Provider and renders an artifact with a remote snippet', async () => {
    const response = await SELF.fetch('https://example.com/artifact')
    expect(await response.text()).toContain(
      'Worker Demo\nDOMAIN,example.com,Proxy',
    )
    expect(response.headers.get('subscription-userinfo')).toContain('total=100')
  })
})
