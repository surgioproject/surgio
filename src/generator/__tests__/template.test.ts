// tslint:disable:no-expression-statement
import { join } from 'path'
import { expect, test } from 'vitest'
import fs from 'fs-extra'

import {
  convertNewSurgeScriptRuleToQuantumultXRewriteRule,
  convertSurgeScriptRuleToQuantumultXRewriteRule,
  createNodeRenderer,
  loadLocalSnippet,
} from '../template.js'

import type { ArtifactConfig } from '../../types.js'

let templateId = 0
const createTestEngine = (clashCore?: 'clash') => {
  const renderer = createNodeRenderer(__dirname, { clashCore })
  return {
    renderString(source: string, context: Readonly<Record<string, unknown>>) {
      return renderer.renderArtifact(
        {
          name: `__test__${templateId++}`,
          provider: 'test',
          template: '',
          templateString: source,
          templateType: 'default',
        } as ArtifactConfig,
        context,
      )
    },
  }
}

const templateEngine = createTestEngine()
const assetDir = join(__dirname, '../../../test/asset/')

for (const [expression, result] of [
  [
    'IP-CIDR,67.198.55.0/24,Proxy,no-resolve',
    '- IP-CIDR,67.198.55.0/24,Proxy,no-resolve',
  ],
  [
    'IP-CIDR,67.198.55.0/24,Proxy,no-resolve // test rule',
    '- IP-CIDR,67.198.55.0/24,Proxy,no-resolve',
  ],
  [
    'PROCESS-NAME,Telegram,Proxy,no-resolve // test rule',
    '- PROCESS-NAME,Telegram,Proxy,no-resolve',
  ],
  ['# Comment', '# Comment'],
  ['URL-REGEX,xxxxxxxxxxxx', ''],
  ['# test', '# test'],
  ['  ', '  '],
  [
    'IP-CIDR6,2011:dab8:3456:82a0::/50,DIRECT',
    '- IP-CIDR6,2011:dab8:3456:82a0::/50,DIRECT',
  ],
  [
    'IP-CIDR6,2011:dab8:3456:82a0::/50,DIRECT,no-resolve',
    '- IP-CIDR6,2011:dab8:3456:82a0::/50,DIRECT,no-resolve',
  ],
  ['GEOIP,HK,DIRECT,no-resolve', '- GEOIP,HK,DIRECT,no-resolve'],
  ['UID,123,DIRECT', '- UID,123,DIRECT'],
] as Array<[string, string]>) {
  test(`clash - ${expression} => ${result}`, () => {
    expect(
      templateEngine.renderString('{{ expression | clash }}', {
        expression,
      }),
    ).toBe(result)
  })
}

test('clash filter can explicitly target legacy Clash', () => {
  const legacyClashEngine = createTestEngine('clash')

  expect(
    legacyClashEngine.renderString('{{ expression | clash }}', {
      expression: 'UID,123,DIRECT',
    }),
  ).toBe('')
})

for (const [expression, result] of [
  [
    'IP-CIDR,67.198.55.0/24,Proxy,no-resolve',
    '- IP-CIDR,67.198.55.0/24,Proxy,no-resolve',
  ],
  [
    'IP-CIDR,67.198.55.0/24,Proxy,no-resolve // test rule',
    '- IP-CIDR,67.198.55.0/24,Proxy,no-resolve',
  ],
  [
    'PROCESS-NAME,Telegram,Proxy,no-resolve // test rule',
    '- PROCESS-NAME,Telegram,Proxy,no-resolve',
  ],
  ['# Comment', '# Comment'],
  ['URL-REGEX,xxxxxxxxxxxx', ''],
  ['# test', '# test'],
  ['  ', '  '],
  [
    'IP-CIDR6,2011:dab8:3456:82a0::/50,DIRECT',
    '- IP-CIDR6,2011:dab8:3456:82a0::/50,DIRECT',
  ],
  [
    'IP-CIDR6,2011:dab8:3456:82a0::/50,DIRECT,no-resolve',
    '- IP-CIDR6,2011:dab8:3456:82a0::/50,DIRECT,no-resolve',
  ],
  ['GEOIP,HK,DIRECT,no-resolve', '- GEOIP,HK,DIRECT,no-resolve'],
  ['FOO,BAR,DIRECT', ''],
] as Array<[string, string]>) {
  test(`clashMeta - ${expression} => ${result}`, () => {
    expect(
      templateEngine.renderString('{{ expression | clashMeta }}', {
        expression,
      }),
    ).toBe(result)
  })
}

for (const [expression, result] of [
  [
    'IP-CIDR,67.198.55.0/24,Proxy,no-resolve',
    '- IP-CIDR,67.198.55.0/24,Proxy,no-resolve',
  ],
  [
    'IP-CIDR,67.198.55.0/24,Proxy,no-resolve // test rule',
    '- IP-CIDR,67.198.55.0/24,Proxy,no-resolve',
  ],
  [
    'PROCESS-NAME,Telegram,Proxy,no-resolve // test rule',
    '- PROCESS-NAME,Telegram,Proxy,no-resolve',
  ],
  ['# Comment', '# Comment'],
  ['URL-REGEX,xxxxxxxxxxxx', ''],
  ['# test', '# test'],
  ['  ', '  '],
  [
    'IP-CIDR6,2011:dab8:3456:82a0::/50,DIRECT',
    '- IP-CIDR6,2011:dab8:3456:82a0::/50,DIRECT',
  ],
  [
    'IP-CIDR6,2011:dab8:3456:82a0::/50,DIRECT,no-resolve',
    '- IP-CIDR6,2011:dab8:3456:82a0::/50,DIRECT,no-resolve',
  ],
  ['GEOIP,HK,DIRECT,no-resolve', '- GEOIP,HK,DIRECT,no-resolve'],
  ['FOO,BAR,DIRECT', ''],
] as Array<[string, string]>) {
  test(`stash - ${expression} => ${result}`, () => {
    expect(
      templateEngine.renderString('{{ expression | stash }}', {
        expression,
      }),
    ).toBe(result)
  })
}

test('base64', () => {
  const body = `{{ str | base64 }}`
  const str = `testtesttesttest`

  const result = templateEngine.renderString(body, {
    str,
  })

  expect(result).toBe('dGVzdHRlc3R0ZXN0dGVzdA==')
})

test('quantumultx filter 1', () => {
  const body = `{{ str | quantumultx }}`

  expect(
    templateEngine.renderString(body, {
      str: `PROCESS-NAME,Telegram,Proxy,no-resolve // test rule`,
    }),
  ).toBe('')
  expect(
    templateEngine.renderString(body, {
      str: 'IP-CIDR6, 2001:4860:4860::8888/32, DIRECT',
    }),
  ).toBe('IP6-CIDR, 2001:4860:4860::8888/32, DIRECT')
})

test('quantumultx filter 2', () => {
  const body = `{{ str | quantumultx }}`
  const str = fs.readFileSync(join(assetDir, 'surge-script-list.txt'), {
    encoding: 'utf8',
  })
  const result = templateEngine.renderString(body, {
    str,
  })

  expect(result).toMatchSnapshot()
})

test('loon filter 1', () => {
  const body = `{{ str | loon }}`
  const str = `# Comment`
  const result = templateEngine.renderString(body, {
    str,
  })

  expect(result).toBe('# Comment')
})

test('loon filter 2', () => {
  const body = `{{ str | loon }}`
  const str = [
    'IP-CIDR,67.198.55.0/24,Proxy,no-resolve // test rule',
    'DOMAIN,example.com,Proxy,force-remote-dns',
  ].join('\n')
  const result = templateEngine.renderString(body, {
    str,
  })

  expect(result).toBe(
    [
      'IP-CIDR,67.198.55.0/24,Proxy,no-resolve',
      'DOMAIN,example.com,Proxy,force-remote-dns',
    ].join('\n'),
  )
})

test('loon filter 3', () => {
  const body = `{{ str | loon }}`
  const str = `IP-CIDR6,xxxxxxxxxxxx`
  const result = templateEngine.renderString(body, {
    str,
  })

  expect(result).toBe('')
})

test('surfboard filter 1', () => {
  const body = `{{ str | surfboard }}`
  const str = `# Comment`
  const result = templateEngine.renderString(body, {
    str,
  })

  expect(result).toBe('# Comment')
})

test('surfboard filter 2', () => {
  const body = `{{ str | surfboard }}`
  const str = [
    'IP-CIDR,67.198.55.0/24,Proxy,no-resolve // test rule',
    'DOMAIN,example.com,Proxy,force-remote-dns',
  ].join('\n')
  const result = templateEngine.renderString(body, {
    str,
  })

  expect(result).toBe(
    [
      'IP-CIDR,67.198.55.0/24,Proxy,no-resolve // test rule',
      'DOMAIN,example.com,Proxy,force-remote-dns',
    ].join('\n'),
  )
})

test('surfboard filter 3', () => {
  const body = `{{ str | surfboard }}`
  const str = `IP-CIDR6,xxxxxxxxxxxx`
  const result = templateEngine.renderString(body, {
    str,
  })

  expect(result).toBe('IP-CIDR6,xxxxxxxxxxxx')
})

test('surfboard filter 4', () => {
  const body = `{{ str | surfboard }}`
  const str = `PROCESS-NAME,Telegram,Proxy,no-resolve // test rule`
  const result = templateEngine.renderString(body, {
    str,
  })

  expect(result).toBe('PROCESS-NAME,Telegram,Proxy,no-resolve // test rule')
})

test('surfboard filter 5', () => {
  const body = `{{ str | surfboard }}`
  const str = `RULE-SET,http://example.com/rule-set,DIRECT`
  const result = templateEngine.renderString(body, {
    str,
  })

  expect(result).toBe('RULE-SET,http://example.com/rule-set,DIRECT')
})

test('surfboard filter 6', () => {
  const body = `{{ str | surfboard }}`
  const str = `URL-REGEX,xxxxxxxxxxxx`
  const result = templateEngine.renderString(body, {
    str,
  })

  expect(result).toBe('')
})

test('spaces in string', () => {
  const str = `    `

  expect(templateEngine.renderString(`{{ str | quantumultx }}`, { str })).toBe(
    '    ',
  )
  expect(templateEngine.renderString(`{{ str | clash }}`, { str })).toBe('    ')
})

test('ForeignMedia', () => {
  const str = fs.readFileSync(join(assetDir, 'ForeignMedia.list'), {
    encoding: 'utf8',
  })

  expect(
    templateEngine.renderString(`{{ str | quantumultx }}`, {
      str,
    }),
  ).toMatchSnapshot()
  expect(
    templateEngine.renderString(`{{ str | clash }}`, {
      str,
    }),
  ).toMatchSnapshot()
})

test('stringify', () => {
  const obj = {
    foo: 'bar',
  }

  expect(
    templateEngine.renderString(`{{ obj | yaml }}`, {
      obj,
    }),
  ).toMatchSnapshot()
  expect(
    templateEngine.renderString(`{{ obj | json }}`, {
      obj,
    }),
  ).toMatchSnapshot()
})

test('convertSurgeScriptRuleToQuantumultXRewriteRule', () => {
  expect(convertSurgeScriptRuleToQuantumultXRewriteRule('')).toBe('')
  expect(
    convertSurgeScriptRuleToQuantumultXRewriteRule(
      'unknown-type https://api.zhihu.com/people/ script-path=https://raw.githubusercontent.com/onewayticket255/Surge-Script/master/surge%20zhihu%20people.js',
    ),
  ).toBe('')
})

test('convertNewSurgeScriptRuleToQuantumultXRewriteRule', () => {
  expect(convertNewSurgeScriptRuleToQuantumultXRewriteRule('')).toBe('')
  expect(
    convertNewSurgeScriptRuleToQuantumultXRewriteRule(
      'zhihu people = type=http-response,requires-body=1,max-size=0,pattern=https://api.zhihu.com/people/,script-path=https://raw.githubusercontent.com/onewayticket255/Surge-Script/master/surge%20zhihu%20people.js',
    ),
  ).toBe(
    'https://api.zhihu.com/people/ url script-response-body https://raw.githubusercontent.com/onewayticket255/Surge-Script/master/surge%20zhihu%20people.js',
  )
  expect(
    convertNewSurgeScriptRuleToQuantumultXRewriteRule(
      'zhihu people = type=http-request,requires-body=1,max-size=0,pattern=https://api.zhihu.com/people/,script-path=https://raw.githubusercontent.com/onewayticket255/Surge-Script/master/surge%20zhihu%20people.js',
    ),
  ).toBe(
    'https://api.zhihu.com/people/ url script-request-body https://raw.githubusercontent.com/onewayticket255/Surge-Script/master/surge%20zhihu%20people.js',
  )
  expect(
    convertNewSurgeScriptRuleToQuantumultXRewriteRule(
      'zhihu people = type=http-response,pattern=https://api.zhihu.com/people/,script-path=https://raw.githubusercontent.com/onewayticket255/Surge-Script/master/surge%20zhihu%20people.js',
    ),
  ).toBe(
    'https://api.zhihu.com/people/ url script-response-header https://raw.githubusercontent.com/onewayticket255/Surge-Script/master/surge%20zhihu%20people.js',
  )
  expect(
    convertNewSurgeScriptRuleToQuantumultXRewriteRule(
      'zhihu people = type=http-request,pattern=https://api.zhihu.com/people/,script-path=https://raw.githubusercontent.com/onewayticket255/Surge-Script/master/surge%20zhihu%20people.js',
    ),
  ).toBe(
    'https://api.zhihu.com/people/ url script-request-header https://raw.githubusercontent.com/onewayticket255/Surge-Script/master/surge%20zhihu%20people.js',
  )
  expect(
    convertNewSurgeScriptRuleToQuantumultXRewriteRule(
      'JD = requires-body=1,max-size=0,script-path= https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js,type=http-response,pattern=^https?://api.m.jd.com/client.action?functionId=(start|signBean)',
    ),
  ).toBe(
    '^https?://api.m.jd.com/client.action?functionId=(start|signBean) url script-response-body https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js',
  )
  expect(
    convertNewSurgeScriptRuleToQuantumultXRewriteRule(
      'zhihu people = type=unknown-type',
    ),
  ).toBe('')
})

test('loadLocalSnippet', async () => {
  expect(
    loadLocalSnippet(__dirname, './snippet.tpl').main('Proxy'),
  ).toMatchSnapshot()
})
