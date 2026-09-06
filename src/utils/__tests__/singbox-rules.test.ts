import { expect, test, vi } from 'vitest'

import {
  convertRulesToSingbox,
  convertRulesToSingboxHeadless,
} from '../singbox-rules.js'

test('convert domain types', () => {
  expect(convertRulesToSingbox('DOMAIN,example.com,Proxy')).toEqual([
    { domain: ['example.com'], outbound: 'Proxy' },
  ])
  expect(convertRulesToSingbox('DOMAIN-SUFFIX,google.com,Proxy')).toEqual([
    { domain_suffix: ['google.com'], outbound: 'Proxy' },
  ])
  expect(convertRulesToSingbox('DOMAIN-KEYWORD,google,Proxy')).toEqual([
    { domain_keyword: ['google'], outbound: 'Proxy' },
  ])
})

test('convert DOMAIN-WILDCARD to anchored regex', () => {
  expect(convertRulesToSingbox('DOMAIN-WILDCARD,*.google.com,Proxy')).toEqual([
    { domain_regex: ['^.*\\.google\\.com$'], outbound: 'Proxy' },
  ])
  expect(convertRulesToSingbox('DOMAIN-WILDCARD,app?e.com,Proxy')).toEqual([
    { domain_regex: ['^app.e\\.com$'], outbound: 'Proxy' },
  ])
  expect(
    convertRulesToSingbox('DOMAIN-WILDCARD,*+wild?.example.org,Proxy'),
  ).toEqual([
    { domain_regex: ['^.*\\+wild.\\.example\\.org$'], outbound: 'Proxy' },
  ])
})

test('convert IP-CIDR and strip no-resolve', () => {
  expect(
    convertRulesToSingbox('IP-CIDR,192.168.0.0/16,Proxy,no-resolve'),
  ).toEqual([{ ip_cidr: ['192.168.0.0/16'], outbound: 'Proxy' }])
  expect(convertRulesToSingbox('IP-CIDR,192.168.0.0/16,DIRECT')).toEqual([
    { ip_cidr: ['192.168.0.0/16'], outbound: 'DIRECT' },
  ])
  expect(
    convertRulesToSingbox('IP-CIDR6,2a03:2880:f200::/64,Proxy,no-resolve'),
  ).toEqual([{ ip_cidr: ['2a03:2880:f200::/64'], outbound: 'Proxy' }])
})

test('convert GEOIP and RULE-SET to rule_set references', () => {
  expect(convertRulesToSingbox('GEOIP,CN,Proxy')).toEqual([
    { rule_set: ['geoip-cn'], outbound: 'Proxy' },
  ])
  expect(convertRulesToSingbox('RULE-SET,my-rules,Proxy')).toEqual([
    { rule_set: ['my-rules'], outbound: 'Proxy' },
  ])
  expect(
    convertRulesToSingbox('RULE-SET,https://example.com/rules.json,Proxy'),
  ).toEqual([
    { rule_set: ['https://example.com/rules.json'], outbound: 'Proxy' },
  ])
})

test('convert process, port and source rules as standalone objects', () => {
  expect(
    convertRulesToSingbox(
      [
        'PROCESS-NAME,Telegram,Proxy',
        'DEST-PORT,443,Proxy',
        'SRC-PORT,10086,Proxy',
        'SRC-IP,192.168.1.0/24,Proxy',
      ].join('\n'),
    ),
  ).toEqual([
    { process_name: ['Telegram'], outbound: 'Proxy' },
    { port: [443], outbound: 'Proxy' },
    { source_port: [10086], outbound: 'Proxy' },
    { source_ip_cidr: ['192.168.1.0/24'], outbound: 'Proxy' },
  ])
})

test('convert PROTOCOL only for TCP and UDP', () => {
  expect(convertRulesToSingbox('PROTOCOL,TCP,Proxy')).toEqual([
    { network: ['tcp'], outbound: 'Proxy' },
  ])
  const onUnsupported = vi.fn()
  expect(
    convertRulesToSingbox('PROTOCOL,ICMP,Proxy', { onUnsupported }),
  ).toEqual([])
  expect(onUnsupported).toHaveBeenCalledWith(
    'PROTOCOL,ICMP,Proxy',
    expect.stringContaining('ICMP'),
  )
})

test('map REJECT policies to the reject action', () => {
  for (const policy of [
    'REJECT',
    'reject-drop',
    'REJECT-TINYGIF',
    'reject-no-drop',
  ]) {
    expect(convertRulesToSingbox(`DOMAIN-SUFFIX,ads.com,${policy}`)).toEqual([
      { domain_suffix: ['ads.com'], action: 'reject' },
    ])
  }
})

test('reject policies merge with each other', () => {
  expect(
    convertRulesToSingbox(
      ['DOMAIN-SUFFIX,a.com,REJECT', 'DOMAIN-KEYWORD,ads,REJECT-DROP'].join(
        '\n',
      ),
    ),
  ).toEqual([
    { domain_suffix: ['a.com'], domain_keyword: ['ads'], action: 'reject' },
  ])
})

test('forced outbound overrides the trailing policy column', () => {
  expect(
    convertRulesToSingbox('DOMAIN,a.com,DIRECT\nIP-CIDR,1.2.3.4/24,REJECT', {
      outbound: 'Proxy',
    }),
  ).toEqual([{ domain: ['a.com'], ip_cidr: ['1.2.3.4/24'], outbound: 'Proxy' }])
})

test('forced outbound works on rules without a policy column', () => {
  expect(
    convertRulesToSingbox('DOMAIN,a.com\nDOMAIN-SUFFIX,b.com', {
      outbound: 'Proxy',
    }),
  ).toEqual([
    { domain: ['a.com'], domain_suffix: ['b.com'], outbound: 'Proxy' },
  ])
})

test('skip comments and blank lines', () => {
  const text = [
    '# 全行注释',
    '// 另一种注释',
    '',
    'DOMAIN-SUFFIX,a.com,Proxy // 行尾注释',
    'DOMAIN-SUFFIX,b.com,Proxy # 行尾注释',
    '   ',
  ].join('\r\n')
  expect(convertRulesToSingbox(text)).toEqual([
    { domain_suffix: ['a.com', 'b.com'], outbound: 'Proxy' },
  ])
})

test('merge consecutive rules with the same policy', () => {
  const text = [
    'DOMAIN-SUFFIX,a.com,Proxy',
    'DOMAIN-SUFFIX,b.com,Proxy',
    'DOMAIN-KEYWORD,foo,Proxy',
    'IP-CIDR,1.2.3.4/24,Proxy',
  ].join('\n')
  expect(convertRulesToSingbox(text)).toEqual([
    {
      domain_suffix: ['a.com', 'b.com'],
      domain_keyword: ['foo'],
      ip_cidr: ['1.2.3.4/24'],
      outbound: 'Proxy',
    },
  ])
})

test('split when the policy changes', () => {
  const text = [
    'DOMAIN-SUFFIX,a.com,Proxy',
    'DOMAIN-SUFFIX,b.com,DIRECT',
    'DOMAIN-SUFFIX,c.com,DIRECT',
  ].join('\n')
  expect(convertRulesToSingbox(text)).toEqual([
    { domain_suffix: ['a.com'], outbound: 'Proxy' },
    { domain_suffix: ['b.com', 'c.com'], outbound: 'DIRECT' },
  ])
})

test('non OR-group rules break the merge run', () => {
  const text = [
    'DOMAIN-SUFFIX,a.com,Proxy',
    'DEST-PORT,443,Proxy',
    'DOMAIN-SUFFIX,b.com,Proxy',
  ].join('\n')
  expect(convertRulesToSingbox(text)).toEqual([
    { domain_suffix: ['a.com'], outbound: 'Proxy' },
    { port: [443], outbound: 'Proxy' },
    { domain_suffix: ['b.com'], outbound: 'Proxy' },
  ])
})

test('parse AND, OR and NOT logical rules', () => {
  expect(
    convertRulesToSingbox('AND,((DOMAIN-SUFFIX,a.com),(DEST-PORT,443)),Proxy'),
  ).toEqual([
    {
      type: 'logical',
      mode: 'and',
      rules: [{ domain_suffix: ['a.com'] }, { port: [443] }],
      outbound: 'Proxy',
    },
  ])
  expect(
    convertRulesToSingbox('OR,((DOMAIN,a.com),(DOMAIN-SUFFIX,b.com)),DIRECT'),
  ).toEqual([
    {
      type: 'logical',
      mode: 'or',
      rules: [{ domain: ['a.com'] }, { domain_suffix: ['b.com'] }],
      outbound: 'DIRECT',
    },
  ])
  expect(convertRulesToSingbox('NOT,((DOMAIN-SUFFIX,a.com)),Proxy')).toEqual([
    {
      type: 'logical',
      mode: 'and',
      rules: [{ domain_suffix: ['a.com'] }],
      invert: true,
      outbound: 'Proxy',
    },
  ])
})

test('logical rules break the merge run', () => {
  const text = [
    'DOMAIN-SUFFIX,a.com,Proxy',
    'AND,((DOMAIN-SUFFIX,b.com),(DEST-PORT,443)),Proxy',
    'DOMAIN-SUFFIX,c.com,Proxy',
  ].join('\n')
  expect(convertRulesToSingbox(text)).toEqual([
    { domain_suffix: ['a.com'], outbound: 'Proxy' },
    {
      type: 'logical',
      mode: 'and',
      rules: [{ domain_suffix: ['b.com'] }, { port: [443] }],
      outbound: 'Proxy',
    },
    { domain_suffix: ['c.com'], outbound: 'Proxy' },
  ])
})

test('report the whole line when a logical sub rule is unsupported', () => {
  const onUnsupported = vi.fn()
  const line = 'AND,((USER-AGENT,foo),(DOMAIN,a.com)),Proxy'
  expect(convertRulesToSingbox(line, { onUnsupported })).toEqual([])
  expect(onUnsupported).toHaveBeenCalledWith(
    line,
    expect.stringContaining('子规则'),
  )
})

test('report FINAL and unsupported rule types', () => {
  const onUnsupported = vi.fn()
  const text = [
    'USER-AGENT,WeChat*,DIRECT',
    'URL-REGEX,^http://example.com,Proxy',
    'IP-ASN,12345,Proxy',
    'SCRIPT,foo,Proxy',
    'WHATEVER,bar,Proxy',
    'FINAL,DIRECT',
    'DOMAIN-SUFFIX,keep.com,Proxy',
  ].join('\n')
  expect(convertRulesToSingbox(text, { onUnsupported })).toEqual([
    { domain_suffix: ['keep.com'], outbound: 'Proxy' },
  ])
  expect(onUnsupported).toHaveBeenCalledTimes(6)
  expect(onUnsupported).toHaveBeenCalledWith(
    'FINAL,DIRECT',
    expect.stringContaining('route.final'),
  )
  expect(onUnsupported).toHaveBeenCalledWith(
    'USER-AGENT,WeChat*,DIRECT',
    expect.stringContaining('USER-AGENT'),
  )
})

test('throw when no policy can be resolved', () => {
  expect(() => convertRulesToSingbox('DOMAIN,a.com')).toThrow(
    '无法从规则中解析出策略：DOMAIN,a.com',
  )
  expect(() => convertRulesToSingbox('IP-CIDR,1.2.3.4/24,no-resolve')).toThrow(
    '无法从规则中解析出策略',
  )
  expect(() =>
    convertRulesToSingbox('AND,((DOMAIN,a.com),(DOMAIN,b.com))'),
  ).toThrow('无法从规则中解析出策略')
})

test('convertRulesToSingboxHeadless emits rules without policy fields', () => {
  const text = [
    'DOMAIN-SUFFIX,a.com',
    'DOMAIN-SUFFIX,b.com',
    'IP-CIDR,1.2.3.4/24,no-resolve',
    'DEST-PORT,443',
    'AND,((DOMAIN-SUFFIX,c.com),(PROTOCOL,UDP))',
    'FINAL,DIRECT',
  ].join('\n')
  const onUnsupported = vi.fn()
  expect(convertRulesToSingboxHeadless(text, { onUnsupported })).toEqual([
    {
      domain_suffix: ['a.com', 'b.com'],
      ip_cidr: ['1.2.3.4/24'],
    },
    { port: [443] },
    {
      type: 'logical',
      mode: 'and',
      rules: [{ domain_suffix: ['c.com'] }, { network: ['udp'] }],
    },
  ])
  expect(onUnsupported).toHaveBeenCalledTimes(1)
  expect(onUnsupported).toHaveBeenCalledWith(
    'FINAL,DIRECT',
    expect.stringContaining('route.final'),
  )
})

test('convertRulesToSingboxHeadless ignores trailing policy columns', () => {
  expect(
    convertRulesToSingboxHeadless(
      'DOMAIN,a.com,Proxy\nDOMAIN-SUFFIX,b.com,DIRECT',
    ),
  ).toEqual([{ domain: ['a.com'], domain_suffix: ['b.com'] }])
})

test('rule_set references merge with each other but not with domain rules', () => {
  const text = [
    'DOMAIN-SUFFIX,cn,DIRECT',
    'GEOIP,CN,DIRECT',
    'RULE-SET,my-direct,DIRECT',
    'DOMAIN-SUFFIX,baidu.com,DIRECT',
  ].join('\n')
  expect(convertRulesToSingbox(text)).toEqual([
    { domain_suffix: ['cn'], outbound: 'DIRECT' },
    { rule_set: ['geoip-cn', 'my-direct'], outbound: 'DIRECT' },
    { domain_suffix: ['baidu.com'], outbound: 'DIRECT' },
  ])
})

test('invalid port values are reported as unsupported', () => {
  const onUnsupported = vi.fn()
  expect(
    convertRulesToSingbox('DEST-PORT,not-a-port,Proxy', { onUnsupported }),
  ).toEqual([])
  expect(onUnsupported).toHaveBeenCalledWith(
    'DEST-PORT,not-a-port,Proxy',
    expect.stringContaining('not-a-port'),
  )
})

test('empty input returns an empty array', () => {
  expect(convertRulesToSingbox('')).toEqual([])
  expect(convertRulesToSingboxHeadless('\n\n')).toEqual([])
})
