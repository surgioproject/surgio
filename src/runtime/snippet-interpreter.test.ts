import { describe, expect, test } from 'vitest'

import {
  parseRestrictedSnippet,
  renderRestrictedSnippet,
} from './snippet-interpreter.js'

describe('restricted Surgio snippet interpreter', () => {
  test('renders identifiers, unicode, comments and whitespace control', () => {
    const source = `  
{# comment #}
{% macro main(rule, label) -%}
{{ rule }},{{ label }} 中文
{%- endmacro %}`
    expect(renderRestrictedSnippet(source, ['DIRECT', '名称'])).toBe(
      'DIRECT,名称 中文',
    )
  })

  test('validates arguments and variables', () => {
    expect(() =>
      renderRestrictedSnippet('{% macro main(a) %}{{ a }}{% endmacro %}', []),
    ).toThrow('缺少 a')
    expect(() =>
      renderRestrictedSnippet('{% macro main(a) %}{{ b }}{% endmacro %}', [
        'x',
      ]),
    ).toThrow(/未知变量 b \(1:/)
    expect(() =>
      parseRestrictedSnippet('{% macro main(a, a) %}x{% endmacro %}'),
    ).toThrow(/宏参数不能重复 \(1:/)
  })

  test.each([
    ['property access', '{{ value.name }}'],
    ['function call', '{{ value() }}'],
    ['filter', '{{ value | upper }}'],
    ['include', '{% include "x.tpl" %}'],
    ['loop', '{% for item in value %}x{% endfor %}'],
    ['condition', '{% if value %}x{% endif %}'],
  ])('rejects %s', (_name, body) => {
    expect(() =>
      parseRestrictedSnippet(`{% macro main(value) %}${body}{% endmacro %}`),
    ).toThrow(/\(1:/)
  })
})
