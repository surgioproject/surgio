import { expect, test } from 'vitest'

import { addProxyToRuleSet } from './ruleset.js'

test('addProxyToRuleSet appends the policy to each rule line', () => {
  expect(addProxyToRuleSet('DOMAIN-SUFFIX,example.com', 'Proxy')).toBe(
    'DOMAIN-SUFFIX,example.com,Proxy',
  )
  expect(addProxyToRuleSet('IP-CIDR,1.2.3.4/24,no-resolve', 'Proxy')).toBe(
    'IP-CIDR,1.2.3.4/24,Proxy,no-resolve',
  )
})

test('addProxyToRuleSet returns the source unchanged without a policy', () => {
  const source = [
    '# comment',
    'DOMAIN-SUFFIX,example.com',
    'IP-CIDR,1.2.3.4/24,no-resolve',
  ].join('\n')
  expect(addProxyToRuleSet(source)).toBe(source)
  expect(addProxyToRuleSet(source, undefined)).toBe(source)
})
