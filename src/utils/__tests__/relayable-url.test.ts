import { expect, test } from 'vitest'

import relayableUrl from '../relayable-url'

test('relayableUrl', () => {
  expect(
    relayableUrl('http://example.com', 'http://proxy.example.com/%URL%'),
  ).toBe('http://proxy.example.com/http://example.com')
  expect(
    relayableUrl('http://example.com', 'http://proxy.example.com/?url=%%URL%%'),
  ).toBe('http://proxy.example.com/?url=http%3A%2F%2Fexample.com')
  expect(relayableUrl('http://example.com')).toBe('http://example.com')
  expect(() => {
    relayableUrl('http://example.com', 'http://proxy.example.com/')
  }).toThrow('relayUrl 中必须包含 %URL% 或 %%URL%% 替换指示符')
})
