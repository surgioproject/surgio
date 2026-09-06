import { expect, test } from 'vitest'

import { createTemplateFilters } from '../template-filters.js'

const getSingboxFilter = () =>
  createTemplateFilters().singbox as (value?: string) => string

test('singbox filter converts rules to JSON without outer brackets', () => {
  const singbox = getSingboxFilter()
  const result = singbox(
    [
      'DOMAIN-SUFFIX,a.com,Proxy',
      'DOMAIN-KEYWORD,foo,Proxy',
      'DEST-PORT,443,Proxy',
    ].join('\n'),
  )
  expect(result).toBe(
    [
      '{"domain_suffix":["a.com"],"domain_keyword":["foo"],"outbound":"Proxy"}',
      '{"port":[443],"outbound":"Proxy"}',
    ].join(',\n'),
  )
})

test('singbox filter silently skips unsupported rules', () => {
  const singbox = getSingboxFilter()
  expect(
    singbox(
      ['USER-AGENT,WeChat*,DIRECT', 'DOMAIN-SUFFIX,a.com,Proxy'].join('\n'),
    ),
  ).toBe('{"domain_suffix":["a.com"],"outbound":"Proxy"}')
})

test('singbox filter returns an empty string for empty input', () => {
  const singbox = getSingboxFilter()
  expect(singbox('')).toBe('')
  expect(singbox(undefined)).toBe('')
  expect(singbox('# 只有注释\n')).toBe('')
})
