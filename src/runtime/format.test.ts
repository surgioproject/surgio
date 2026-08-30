import { expect, test } from 'vitest'

import { formatProviderNodes } from './format.js'

test('rejects the removed Shadowsocks JSON output format', () => {
  expect(() => formatProviderNodes('shadowsocks-json' as never, [])).toThrow(
    'Unsupported provider format: shadowsocks-json',
  )
})
