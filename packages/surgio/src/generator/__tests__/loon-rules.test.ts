import { expect, test } from 'vitest'

import { createTemplateFilters } from '../template-filters.js'

const filters = createTemplateFilters()

test.each([
  'URL-REGEX,^http://example.com,PROXY',
  'URL-REGEX,^https://example.com/path//file,PROXY',
  'IP-CIDR6,2001:db8::/32,PROXY,no-resolve',
  'IP-ASN,4134,DIRECT',
  'SRC-PORT,443,DIRECT',
  'DEST-PORT,443,PROXY',
  'PROTOCOL,STUN,REJECT',
  'AND,((DOMAIN,example.com),(DEST-PORT,443)),PROXY',
  'OR,((DOMAIN,example.com),(DEST-PORT,443)),PROXY',
  'NOT,((DOMAIN,example.com)),PROXY',
])('preserve Loon rule %s', (rule) => {
  expect(filters.loon(rule)).toBe(rule)
  expect(filters.loon(`${rule} // comment`)).toBe(rule)
})

test('keep unsupported rules filtered and comments intact', () => {
  expect(filters.loon('# comment\nPROCESS-NAME,test,PROXY\nFINAL,DIRECT')).toBe(
    '# comment\nFINAL,DIRECT',
  )
})

test.each(['clash', 'clashMeta', 'stash'])(
  '%s comments preserve embedded slashes',
  (format) => {
    const rule = 'RULE-SET,https://example.com/rules,PROXY'
    expect(filters[format](`${rule} // comment`)).toBe(`- ${rule}`)
  },
)
