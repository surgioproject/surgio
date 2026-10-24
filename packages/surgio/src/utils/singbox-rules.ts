/**
 * 将 Surge 格式的规则文本转换为 sing-box 规则对象。
 *
 * @see https://sing-box.sagernet.org/configuration/route/rule/
 * @see https://sing-box.sagernet.org/configuration/rule-set/headless-rule/
 */

export interface SingboxRuleConversionOptions {
  /** Force this policy for every line, ignoring any trailing policy column. */
  readonly outbound?: string
  /** Called for each line that cannot be expressed in sing-box. */
  readonly onUnsupported?: (line: string, reason: string) => void
}

export interface SingboxRuleMatchFields {
  readonly domain?: ReadonlyArray<string>
  readonly domain_suffix?: ReadonlyArray<string>
  readonly domain_keyword?: ReadonlyArray<string>
  readonly domain_regex?: ReadonlyArray<string>
  readonly ip_cidr?: ReadonlyArray<string>
  readonly rule_set?: ReadonlyArray<string>
  readonly process_name?: ReadonlyArray<string>
  readonly port?: ReadonlyArray<number>
  readonly source_port?: ReadonlyArray<number>
  readonly source_ip_cidr?: ReadonlyArray<string>
  readonly network?: ReadonlyArray<string>
}

export interface SingboxLogicalRule {
  readonly type: 'logical'
  readonly mode: 'and' | 'or'
  readonly rules: ReadonlyArray<SingboxRuleMatchFields>
  readonly invert?: boolean
}

export type SingboxRulePolicy =
  { readonly outbound: string } | { readonly action: 'reject' }

export type SingboxRouteRule = (SingboxRuleMatchFields | SingboxLogicalRule) &
  SingboxRulePolicy

export type SingboxHeadlessRule = SingboxRuleMatchFields | SingboxLogicalRule

interface ParsedRuleEntry {
  readonly rule: SingboxRuleMatchFields | SingboxLogicalRule
  readonly policy: SingboxRulePolicy | null
}

interface ParseContext {
  readonly headless: boolean
  readonly outbound?: string
  readonly onUnsupported?: (line: string, reason: string) => void
}

type FieldMapping =
  { readonly fields: SingboxRuleMatchFields } | { readonly reason: string }

type LogicalMapping =
  | { readonly rule: SingboxLogicalRule; readonly policy?: string }
  | { readonly reason: string }

/**
 * sing-box 在同一条规则里对 domain/ip 字段取 OR，但 rule_set 与其它字段取 AND，
 * 因此 rule_set 只能和相邻的 rule_set 行合并，不能混入 domain/ip 组。
 */
const MERGE_GROUP_BY_FIELD: Readonly<Record<string, string>> = {
  domain: 'address',
  domain_suffix: 'address',
  domain_keyword: 'address',
  domain_regex: 'address',
  ip_cidr: 'address',
  rule_set: 'rule_set',
}

const REJECT_POLICIES: ReadonlySet<string> = new Set([
  'REJECT',
  'REJECT-DROP',
  'REJECT-TINYGIF',
  'REJECT-NO-DROP',
])

const POLICY_IN_THIRD_COLUMN: ReadonlySet<string> = new Set([
  'IP-CIDR',
  'IP-CIDR6',
  'IP-ASN',
  'GEOIP',
])

const LOGICAL_MODES: Readonly<Record<string, 'and' | 'or'>> = {
  AND: 'and',
  OR: 'or',
}

const SIMPLE_FIELD_MAP: Readonly<Record<string, keyof SingboxRuleMatchFields>> =
  {
    DOMAIN: 'domain',
    'DOMAIN-SUFFIX': 'domain_suffix',
    'DOMAIN-KEYWORD': 'domain_keyword',
    'IP-CIDR': 'ip_cidr',
    'IP-CIDR6': 'ip_cidr',
    'RULE-SET': 'rule_set',
    'PROCESS-NAME': 'process_name',
    'SRC-IP': 'source_ip_cidr',
  }

const REGEX_SPECIALS = /[.+^${}()|[\]\\]/g

const wildcardToRegex = (pattern: string): string =>
  `^${pattern
    .replace(REGEX_SPECIALS, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')}$`

const splitRuleLines = (ruleText: string): string[] =>
  ruleText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) => line !== '' && !line.startsWith('#') && !line.startsWith('//'),
    )
    .map((line) => line.replace(/\s+(?:\/\/|#).*$/, '').trim())
    .filter((line) => line !== '')

const getRuleType = (line: string): string =>
  line.split(',', 1)[0].trim().toUpperCase()

const mapPortField = (
  key: 'port' | 'source_port',
  value: string,
): FieldMapping => {
  const port = Number(value)
  if (!Number.isInteger(port)) return { reason: `端口值无效：${value}` }
  return {
    fields: key === 'port' ? { port: [port] } : { source_port: [port] },
  }
}

const mapProtocolField = (value: string): FieldMapping => {
  const network = value.toLowerCase()
  return network === 'tcp' || network === 'udp'
    ? { fields: { network: [network] } }
    : { reason: `sing-box 不支持 PROTOCOL 的值：${value}` }
}

const mapPlainRule = (
  type: string,
  columns: ReadonlyArray<string>,
): FieldMapping => {
  const value = columns[1]
  if (!value) return { reason: `规则缺少匹配值：${columns.join(',')}` }
  const simpleField = SIMPLE_FIELD_MAP[type]
  if (simpleField) {
    return { fields: { [simpleField]: [value] } as SingboxRuleMatchFields }
  }
  switch (type) {
    case 'DOMAIN-WILDCARD':
      return { fields: { domain_regex: [wildcardToRegex(value)] } }
    case 'GEOIP':
      return { fields: { rule_set: [`geoip-${value.toLowerCase()}`] } }
    case 'DEST-PORT':
      return mapPortField('port', value)
    case 'SRC-PORT':
      return mapPortField('source_port', value)
    case 'PROTOCOL':
      return mapProtocolField(value)
    default:
      return { reason: `sing-box 不支持 ${type} 规则` }
  }
}

const parseSubRule = (source: string): SingboxRuleMatchFields | null => {
  const type = getRuleType(source)
  if (type in LOGICAL_MODES || type === 'NOT') return null
  const columns = source.split(',').map((column) => column.trim())
  const mapping = mapPlainRule(type, columns)
  return 'fields' in mapping ? mapping.fields : null
}

const unwrapSubRuleGroup = (group: string): string | null => {
  const trimmed = group.trim()
  return trimmed.startsWith('(') && trimmed.endsWith(')')
    ? trimmed.slice(1, -1)
    : null
}

const splitSubRuleGroups = (source: string): ReadonlyArray<string> | null => {
  const groups: string[] = []
  let depth = 0
  let start = 0
  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    if (char === '(') depth++
    else if (char === ')') depth--
    else if (char === ',' && depth === 0) {
      groups.push(source.slice(start, index))
      start = index + 1
    }
  }
  groups.push(source.slice(start))
  const unwrapped = groups.map(unwrapSubRuleGroup)
  return unwrapped.every((group): group is string => group !== null)
    ? unwrapped
    : null
}

const extractLogicalBody = (
  source: string,
): {
  readonly groups: ReadonlyArray<string>
  readonly policy?: string
} | null => {
  if (!source.startsWith('(')) return null
  let depth = 0
  let end = -1
  for (let index = 0; index < source.length; index++) {
    if (source[index] === '(') depth++
    else if (source[index] === ')') {
      depth--
      if (depth === 0) {
        end = index
        break
      }
    }
  }
  if (end === -1) return null
  const trailing = source.slice(end + 1).trim()
  if (trailing !== '' && !trailing.startsWith(',')) return null
  const groups = splitSubRuleGroups(source.slice(1, end))
  if (!groups) return null
  const policy = trailing.slice(1).trim()
  return { groups, policy: policy === '' ? undefined : policy }
}

const mapLogicalRule = (type: string, line: string): LogicalMapping => {
  const body = extractLogicalBody(line.slice(line.indexOf(',') + 1).trim())
  if (!body || body.groups.length === 0) {
    return { reason: `无法解析逻辑规则：${line}` }
  }
  const subRules: SingboxRuleMatchFields[] = []
  for (const group of body.groups) {
    const subRule = parseSubRule(group)
    if (!subRule) {
      return { reason: `逻辑规则包含 sing-box 不支持的子规则：${line}` }
    }
    subRules.push(subRule)
  }
  if (type === 'NOT') {
    return subRules.length === 1
      ? {
          rule: { type: 'logical', mode: 'and', rules: subRules, invert: true },
          policy: body.policy,
        }
      : { reason: `NOT 规则只能包含一条子规则：${line}` }
  }
  return {
    rule: { type: 'logical', mode: LOGICAL_MODES[type], rules: subRules },
    policy: body.policy,
  }
}

const extractPolicyColumn = (
  type: string,
  columns: ReadonlyArray<string>,
): string | undefined => {
  if (POLICY_IN_THIRD_COLUMN.has(type)) {
    const policy = columns[2]
    return policy && policy.toUpperCase() !== 'NO-RESOLVE' ? policy : undefined
  }
  if (columns.length < 3) return undefined
  const policy = columns[columns.length - 1]
  return policy === '' ? undefined : policy
}

const resolvePolicy = (
  context: ParseContext,
  type: string,
  columns: ReadonlyArray<string>,
  line: string,
  logicalPolicy?: string,
): SingboxRulePolicy | null => {
  if (context.headless) return null
  const policy =
    context.outbound ?? logicalPolicy ?? extractPolicyColumn(type, columns)
  if (!policy) throw new Error(`无法从规则中解析出策略：${line}`)
  return REJECT_POLICIES.has(policy.toUpperCase())
    ? { action: 'reject' }
    : { outbound: policy }
}

const parsePlainLine = (
  line: string,
  type: string,
  context: ParseContext,
): ParsedRuleEntry | null => {
  const columns = line.split(',').map((column) => column.trim())
  const mapping = mapPlainRule(type, columns)
  if ('reason' in mapping) {
    context.onUnsupported?.(line, mapping.reason)
    return null
  }
  return {
    rule: mapping.fields,
    policy: resolvePolicy(context, type, columns, line),
  }
}

const parseLogicalLine = (
  line: string,
  type: string,
  context: ParseContext,
): ParsedRuleEntry | null => {
  const mapping = mapLogicalRule(type, line)
  if ('reason' in mapping) {
    context.onUnsupported?.(line, mapping.reason)
    return null
  }
  return {
    rule: mapping.rule,
    policy: resolvePolicy(context, type, [], line, mapping.policy),
  }
}

const parseLine = (
  line: string,
  context: ParseContext,
): ParsedRuleEntry | null => {
  const type = getRuleType(line)
  if (type === 'FINAL') {
    context.onUnsupported?.(
      line,
      'FINAL 规则对应 sing-box 的 route.final，请在模板中配置 final 字段',
    )
    return null
  }
  return type in LOGICAL_MODES || type === 'NOT'
    ? parseLogicalLine(line, type, context)
    : parsePlainLine(line, type, context)
}

const getMergeable = (
  entry: ParsedRuleEntry,
): { group: string; fields: SingboxRuleMatchFields } | null => {
  if ('type' in entry.rule) return null
  const group = MERGE_GROUP_BY_FIELD[Object.keys(entry.rule)[0]]
  return group ? { group, fields: entry.rule } : null
}

const getPolicyKey = (policy: SingboxRulePolicy | null): string => {
  if (policy === null) return ''
  return 'outbound' in policy ? `outbound:${policy.outbound}` : 'action:reject'
}

type MutableFields = Record<string, Array<string | number>>

const appendFields = (
  target: MutableFields,
  fields: SingboxRuleMatchFields,
): void => {
  for (const [key, values] of Object.entries(fields)) {
    target[key] = key in target ? [...target[key], ...values] : [...values]
  }
}

const mergeEntries = (
  entries: ReadonlyArray<ParsedRuleEntry>,
): Array<Record<string, unknown>> => {
  const output: Array<Record<string, unknown>> = []
  let pending: {
    key: string
    policy: SingboxRulePolicy | null
    fields: MutableFields
  } | null = null
  const flush = (): void => {
    if (pending) {
      output.push({ ...pending.fields, ...(pending.policy ?? {}) })
      pending = null
    }
  }
  for (const entry of entries) {
    const mergeable = getMergeable(entry)
    if (!mergeable) {
      flush()
      output.push({ ...entry.rule, ...(entry.policy ?? {}) })
      continue
    }
    const key = `${mergeable.group}|${getPolicyKey(entry.policy)}`
    if (pending && pending.key === key) {
      appendFields(pending.fields, mergeable.fields)
    } else {
      flush()
      pending = {
        key,
        policy: entry.policy,
        fields: { ...mergeable.fields } as MutableFields,
      }
    }
  }
  flush()
  return output
}

export const convertRulesToSingbox = (
  ruleText: string,
  options: SingboxRuleConversionOptions = {},
): SingboxRouteRule[] => {
  const context: ParseContext = { ...options, headless: false }
  return mergeEntries(
    splitRuleLines(ruleText)
      .map((line) => parseLine(line, context))
      .filter((entry): entry is ParsedRuleEntry => entry !== null),
  ) as unknown as SingboxRouteRule[]
}

export const convertRulesToSingboxHeadless = (
  ruleText: string,
  options: Pick<SingboxRuleConversionOptions, 'onUnsupported'> = {},
): SingboxHeadlessRule[] => {
  const context: ParseContext = { ...options, headless: true }
  return mergeEntries(
    splitRuleLines(ruleText)
      .map((line) => parseLine(line, context))
      .filter((entry): entry is ParsedRuleEntry => entry !== null),
  ) as unknown as SingboxHeadlessRule[]
}
