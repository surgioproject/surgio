import YAML from 'yaml'

import {
  CLASH_META_SUPPORTED_RULE,
  CLASH_SUPPORTED_RULE,
  LOON_SUPPORTED_RULE,
  QUANTUMULT_X_SUPPORTED_RULE,
  STASH_SUPPORTED_RULE,
  SURFBOARD_SUPPORTED_RULE,
} from '../constant/index.js'
import { decodeStringList, toBase64 } from '../utils/portable.js'

import type { ClashCoreType } from '../types.js'

const filterRules = (
  supportedRules: readonly string[],
  prefix = '',
  stripComments = false,
) => {
  const supported = new Set(supportedRules)
  return (value?: string): string => {
    if (!value) return ''
    return value
      .split('\n')
      .map((line) => {
        const normalized = line.trim().toUpperCase()
        if (!normalized || normalized.startsWith('#')) return line
        const type = normalized.match(/^([\w-]+),/)?.[1]
        if (!type || !supported.has(type)) return undefined
        const output = stripComments ? line.replace(/\/\/.*$/, '') : line
        return `${prefix}${output.trim()}`
      })
      .filter((line): line is string => Boolean(line))
      .join('\n')
  }
}

const clashRules = (core: ClashCoreType) =>
  filterRules(
    core === 'stash'
      ? STASH_SUPPORTED_RULE
      : core === 'clash.meta'
        ? CLASH_META_SUPPORTED_RULE
        : CLASH_SUPPORTED_RULE,
    '- ',
    true,
  )

export const convertSurgeScriptRuleToQuantumultXRewriteRule = (
  value: string,
): string => {
  const parts = value.split(' ')
  const result: string[] = []
  const type = parts[0]
  if (type !== 'http-request' && type !== 'http-response') return ''
  const params = decodeStringList(parts.splice(2).join('').split(','))
  const request = type === 'http-request'
  result.push(
    parts[1],
    'url',
    `script-${request ? 'request' : 'response'}-${
      'requires-body' in params ? 'body' : 'header'
    }`,
    params['script-path'] as string,
  )
  return result.join(' ')
}

export const convertNewSurgeScriptRuleToQuantumultXRewriteRule = (
  value: string,
): string => {
  const matched = value.match(/^(.+?)=(.+?)$/)
  if (!matched) return ''
  const params = decodeStringList(matched[2].trim().split(','))
  const request = params.type === 'http-request'
  const response = params.type === 'http-response'
  if (!request && !response) return ''
  return [
    params.pattern,
    'url',
    `script-${request ? 'request' : 'response'}-${
      'requires-body' in params ? 'body' : 'header'
    }`,
    params['script-path'],
  ].join(' ')
}

const quantumultXRules = (value?: string): string => {
  if (!value) return ''
  return value
    .split('\n')
    .map((line) => {
      const normalized = line.trim().toUpperCase()
      if (!normalized || normalized.startsWith('#')) return line
      if (
        normalized.startsWith('HTTP-REQUEST') ||
        normalized.startsWith('HTTP-RESPONSE')
      ) {
        return convertSurgeScriptRuleToQuantumultXRewriteRule(line)
      }
      if (/type\s?=\s?http-(?:request|response)/.test(line)) {
        return convertNewSurgeScriptRuleToQuantumultXRewriteRule(line)
      }
      const type = normalized.match(/^([\w-]+),/)?.[1]
      if (
        !type ||
        !(QUANTUMULT_X_SUPPORTED_RULE as readonly string[]).includes(type)
      ) {
        return undefined
      }
      return type === 'IP-CIDR6' ? line.replace(/IP-CIDR6/i, 'IP6-CIDR') : line
    })
    .filter((line): line is string => Boolean(line))
    .join('\n')
}

export const createTemplateFilters = (
  options: { readonly clashCore?: ClashCoreType } = {},
): Readonly<Record<string, (...args: any[]) => unknown>> => ({
  clash: clashRules(options.clashCore ?? 'clash.meta'),
  clashMeta: clashRules('clash.meta'),
  stash: clashRules('stash'),
  quantumultx: quantumultXRules,
  loon: filterRules(LOON_SUPPORTED_RULE, '', true),
  surfboard: filterRules(SURFBOARD_SUPPORTED_RULE),
  yaml: (value: unknown) => YAML.stringify(value),
  base64: (value: string) => toBase64(value),
  json: (value: unknown) => JSON.stringify(value),
})
