import { randomUUID } from 'node:crypto'
import { promises as fsp } from 'node:fs'
import path from 'node:path'
import fs from 'fs-extra'
import { builders, generateCode, parseModule } from 'magicast'

import type {
  ArtifactConfigInput,
  PossibleProviderConfigType,
} from '../types.js'

type AstNode = Record<string, any>

export class SurgioProjectEditError extends Error {
  constructor(
    message: string,
    public readonly manualSnippet: string,
  ) {
    super(`${message}\n\n请手动添加：\n${manualSnippet}`)
    this.name = 'SurgioProjectEditError'
  }
}

const expressionWrappers = new Set([
  'ParenthesizedExpression',
  'TSAsExpression',
  'TSNonNullExpression',
  'TSSatisfiesExpression',
  'TypeCastExpression',
])

const unwrapExpression = (node: AstNode | undefined): AstNode | undefined => {
  let current = node
  while (current && expressionWrappers.has(current.type)) {
    current = current.expression
  }
  return current
}

const propertyName = (property: AstNode): string | undefined => {
  if (
    !['ObjectProperty', 'Property'].includes(property.type) ||
    property.computed
  ) {
    return undefined
  }
  if (property.key?.type === 'Identifier') return property.key.name
  if (
    ['Literal', 'StringLiteral'].includes(property.key?.type) &&
    typeof property.key.value === 'string'
  ) {
    return property.key.value
  }
  return undefined
}

const findTopLevelConst = (
  program: AstNode,
  name: string,
  resolving = new Set<string>(),
): AstNode | undefined => {
  if (resolving.has(name)) return undefined
  resolving.add(name)

  const matches: AstNode[] = []
  for (const statement of program.body ?? []) {
    if (statement.type !== 'VariableDeclaration' || statement.kind !== 'const')
      continue
    for (const declaration of statement.declarations ?? []) {
      if (
        declaration.id?.type === 'Identifier' &&
        declaration.id.name === name
      ) {
        matches.push(declaration)
      }
    }
  }
  if (matches.length !== 1) return undefined

  const value = unwrapExpression(matches[0].init)
  return value?.type === 'Identifier'
    ? findTopLevelConst(program, value.name, resolving)
    : value
}

const resolveStaticExpression = (
  program: AstNode,
  expression: AstNode | undefined,
): AstNode | undefined => {
  const value = unwrapExpression(expression)
  return value?.type === 'Identifier'
    ? findTopLevelConst(program, value.name)
    : value
}

const findProjectObject = (program: AstNode): AstNode | undefined => {
  const defaultExports = (program.body ?? []).filter(
    (statement: AstNode) => statement.type === 'ExportDefaultDeclaration',
  )
  if (defaultExports.length !== 1) return undefined

  let expression = unwrapExpression(defaultExports[0].declaration)
  if (expression?.type === 'CallExpression') {
    if (
      expression.callee?.type !== 'Identifier' ||
      expression.callee.name !== 'defineSurgioProject' ||
      expression.arguments?.length !== 1
    ) {
      return undefined
    }
    expression = unwrapExpression(expression.arguments[0])
  }

  return resolveStaticExpression(program, expression)?.type ===
    'ObjectExpression'
    ? resolveStaticExpression(program, expression)
    : undefined
}

const findProjectField = (
  program: AstNode,
  project: AstNode,
  field: 'artifacts' | 'providers',
  expectedType: 'ArrayExpression' | 'ObjectExpression',
): AstNode | undefined => {
  if (
    (project.properties ?? []).some(
      (property: AstNode) =>
        property.type === 'SpreadElement' ||
        propertyName(property) === undefined,
    )
  ) {
    return undefined
  }
  const matches = (project.properties ?? []).filter(
    (property: AstNode) => propertyName(property) === field,
  )
  if (matches.length !== 1) return undefined
  const value = resolveStaticExpression(program, matches[0].value)
  return value?.type === expectedType ? value : undefined
}

const serializeExpression = (value: unknown): string => {
  if (value === null || typeof value === 'boolean' || typeof value === 'number')
    return JSON.stringify(value)
  if (typeof value === 'string')
    return JSON.stringify(value)
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029')
  if (Array.isArray(value)) {
    return `[${value.map(serializeExpression).join(', ')}]`
  }
  if (value && typeof value === 'object') {
    const properties = Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => {
        const renderedKey = /^[A-Z_$][\w$]*$/i.test(key)
          ? key
          : JSON.stringify(key)
        return `${renderedKey}: ${serializeExpression(item)}`
      })
    return `{ ${properties.join(', ')} }`
  }
  throw new TypeError(`无法序列化 ${typeof value} 类型的 Project 配置`)
}

const detachNode = (node: AstNode, seen = new Set<object>()): AstNode => {
  if (!node || typeof node !== 'object' || seen.has(node)) return node
  seen.add(node)
  for (const key of ['end', 'extra', 'loc', 'original', 'start', 'tokens']) {
    if (key in node) node[key] = null
  }
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'original', 'tokens'].includes(key)) continue
    if (Array.isArray(value)) {
      value.forEach((item) => detachNode(item, seen))
    } else if (value && typeof value === 'object') {
      detachNode(value as AstNode, seen)
    }
  }
  return node
}

const expressionNode = (value: unknown): AstNode =>
  detachNode(builders.raw(serializeExpression(value)).$ast as AstNode)

const objectPropertyNode = (name: string, value: unknown): AstNode => {
  const renderedName = /^[A-Z_$][\w$]*$/i.test(name)
    ? name
    : JSON.stringify(name)
  const object = builders.raw(
    `({ ${renderedName}: ${serializeExpression(value)} })`,
  ).$ast as AstNode
  return detachNode(object.properties[0])
}

const readStaticObjectKey = (property: AstNode): string | undefined =>
  property.type === 'SpreadElement' ? undefined : propertyName(property)

const readStaticArtifactName = (element: AstNode): string | undefined => {
  const value = unwrapExpression(element)
  if (value?.type !== 'ObjectExpression') return undefined
  const properties = (value.properties ?? []).filter(
    (property: AstNode) => propertyName(property) === 'name',
  )
  if (properties.length !== 1) return undefined
  const name = unwrapExpression(properties[0].value)
  return name &&
    ['Literal', 'StringLiteral'].includes(name.type) &&
    typeof name.value === 'string'
    ? name.value
    : undefined
}

const restoreSourceFormat = (code: string, source: string): string => {
  const trailingNewline = /\r?\n$/.test(source)
  let output = code.replace(/\r\n/g, '\n')
  output = trailingNewline
    ? `${output.replace(/\n+$/, '')}\n`
    : output.replace(/\n+$/, '')
  return source.includes('\r\n') ? output.replace(/\n/g, '\r\n') : output
}

const parseStaticProject = (
  source: string,
  field: 'artifacts' | 'providers',
  expectedType: 'ArrayExpression' | 'ObjectExpression',
  snippet: string,
): { module: ReturnType<typeof parseModule>; container: AstNode } => {
  let module: ReturnType<typeof parseModule>
  try {
    module = parseModule(source)
  } catch (error) {
    throw new SurgioProjectEditError(
      `无法解析 Surgio Project：${error instanceof Error ? error.message : String(error)}`,
      snippet,
    )
  }
  const program = module.$ast as AstNode
  const project = findProjectObject(program)
  const container = project
    ? findProjectField(program, project, field, expectedType)
    : undefined
  if (!container) {
    throw new SurgioProjectEditError(
      `无法安全定位静态 ${field} 配置，Project 未被修改`,
      snippet,
    )
  }
  return { module, container }
}

const generateValidatedProject = (
  module: ReturnType<typeof parseModule>,
  source: string,
  snippet: string,
): string => {
  const code = restoreSourceFormat(generateCode(module).code, source)
  try {
    parseModule(code)
  } catch (error) {
    throw new SurgioProjectEditError(
      `生成后的 Surgio Project 无法解析，原文件未被修改：${error instanceof Error ? error.message : String(error)}`,
      snippet,
    )
  }
  return code
}

export const addProviderToProjectSource = (
  source: string,
  name: string,
  definition: PossibleProviderConfigType,
): string => {
  const entry = `${serializeExpression(name)}: ${serializeExpression(definition)}`
  const snippet = `providers: {\n  ${entry},\n}`
  const { module, container } = parseStaticProject(
    source,
    'providers',
    'ObjectExpression',
    snippet,
  )
  const keys = (container.properties ?? []).map(readStaticObjectKey)
  if (keys.some((key: string | undefined) => key === undefined)) {
    throw new SurgioProjectEditError(
      'providers 包含无法静态分析的属性，Project 未被修改',
      snippet,
    )
  }
  if (keys.includes(name)) {
    throw new SurgioProjectEditError(`Provider ${name} 已存在`, snippet)
  }
  container.properties.push(objectPropertyNode(name, definition))
  return generateValidatedProject(module, source, snippet)
}

export const addArtifactToProjectSource = (
  source: string,
  artifact: ArtifactConfigInput,
): string => {
  const snippet = `artifacts: [\n  ${serializeExpression(artifact)},\n]`
  const { module, container } = parseStaticProject(
    source,
    'artifacts',
    'ArrayExpression',
    snippet,
  )
  const names = (container.elements ?? []).map(readStaticArtifactName)
  if (names.some((name: string | undefined) => name === undefined)) {
    throw new SurgioProjectEditError(
      'artifacts 包含无法静态分析的项目，Project 未被修改',
      snippet,
    )
  }
  if (names.includes(artifact.name)) {
    throw new SurgioProjectEditError(
      `Artifact ${artifact.name} 已存在`,
      snippet,
    )
  }
  container.elements.push(expressionNode(artifact))
  return generateValidatedProject(module, source, snippet)
}

export const updateSurgioProjectFile = async (
  filename: string,
  update: (source: string) => string,
): Promise<void> => {
  const source = await fs.readFile(filename, 'utf8')
  const output = update(source)
  const stat = await fsp.stat(filename)
  const temporary = path.join(
    path.dirname(filename),
    `.${path.basename(filename)}.${process.pid}.${randomUUID()}.tmp`,
  )
  try {
    await fsp.writeFile(temporary, output, {
      encoding: 'utf8',
      mode: stat.mode,
    })
    await fsp.rename(temporary, filename)
  } finally {
    await fs.remove(temporary)
  }
}
