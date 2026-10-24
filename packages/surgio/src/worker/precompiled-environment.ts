import filters from 'nunjucks/src/filters.js'
import createGlobals from 'nunjucks/src/globals.js'
import lib from 'nunjucks/src/lib.js'
import runtime from 'nunjucks/src/runtime.js'
import tests from 'nunjucks/src/tests.js'

import type { WorkerCompiledTemplate } from './types.js'

type Callback<T> = (error: Error | null, value?: T | null) => void
type RenderFunction = (
  environment: PrecompiledTemplateEnvironment,
  context: TemplateContext,
  frame: any,
  runtime: any,
  callback: Callback<string>,
) => void

const runWaterfall = (
  tasks: ReadonlyArray<(...args: any[]) => void>,
  callback: (...args: any[]) => void,
  forceAsync = false,
): void => {
  let index = 0
  const next = (error?: unknown, ...values: unknown[]): void => {
    if (error || index === tasks.length) {
      callback(error, ...values)
      return
    }
    const task = tasks[index++]
    const run = () => task(...values, next)
    if (forceAsync) queueMicrotask(run)
    else run()
  }
  next()
}

const resolveRelativeName = (parent: string, name: string): string => {
  if (!/^\.\.?(?:\/|$)/.test(name)) return name
  const parts = parent.split('/').slice(0, -1)
  for (const part of name.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return parts.join('/')
}

class TemplateContext {
  readonly env: PrecompiledTemplateEnvironment
  readonly ctx: Record<string, unknown>
  readonly blocks: Record<string, RenderFunction[]>
  readonly exported: string[] = []

  constructor(
    context: Record<string, unknown>,
    blocks: Record<string, RenderFunction>,
    environment: PrecompiledTemplateEnvironment,
  ) {
    this.env = environment
    this.ctx = { ...context }
    this.blocks = {}
    for (const [name, block] of Object.entries(blocks))
      this.addBlock(name, block)
  }

  lookup(name: string): unknown {
    return name in this.env.globals && !(name in this.ctx)
      ? this.env.globals[name]
      : this.ctx[name]
  }
  setVariable(name: string, value: unknown): void {
    this.ctx[name] = value
  }
  getVariables(): Record<string, unknown> {
    return this.ctx
  }
  addBlock(name: string, block: RenderFunction): this {
    ;(this.blocks[name] ??= []).push(block)
    return this
  }
  getBlock(name: string): RenderFunction {
    const block = this.blocks[name]?.[0]
    if (!block) throw new Error(`unknown block "${name}"`)
    return block
  }
  getSuper(
    environment: PrecompiledTemplateEnvironment,
    name: string,
    block: RenderFunction,
    frame: any,
    runtimeValue: any,
    callback: Callback<string>,
  ): void {
    const index = this.blocks[name]?.indexOf(block) ?? -1
    const parent = this.blocks[name]?.[index + 1]
    if (!parent) throw new Error(`no super block available for "${name}"`)
    parent(environment, this, frame, runtimeValue, callback)
  }
  addExport(name: string): void {
    this.exported.push(name)
  }
  getExported(): Record<string, unknown> {
    return Object.fromEntries(
      this.exported.map((name) => [name, this.ctx[name]]),
    )
  }
}

class PrecompiledTemplate {
  readonly #blocks: Record<string, RenderFunction>
  readonly #root: RenderFunction

  constructor(
    readonly props: WorkerCompiledTemplate,
    readonly environment: PrecompiledTemplateEnvironment,
    readonly path: string,
  ) {
    this.#root = props.root as RenderFunction
    this.#blocks = Object.fromEntries(
      Object.entries(props).flatMap(([name, value]) =>
        name.startsWith('b_')
          ? [[name.slice(2), value as RenderFunction] as const]
          : [],
      ),
    )
  }

  render(
    context: Record<string, unknown> = {},
    parentFrame?: any,
    callback?: Callback<string>,
  ): string | null {
    if (typeof parentFrame === 'function') {
      callback = parentFrame
      parentFrame = undefined
    }
    const templateContext = new TemplateContext(
      context,
      this.#blocks,
      this.environment,
    )
    const frame = parentFrame ? parentFrame.push(true) : new runtime.Frame()
    frame.topLevel = true
    let result: string | null = null
    this.#root(
      this.environment,
      templateContext,
      frame,
      runtime,
      (error, value) => {
        const prettyError = error
          ? lib._prettifyError(this.path, this.environment.opts.dev, error)
          : null
        if (callback) callback(prettyError, value)
        else if (prettyError) throw prettyError
        else result = value ?? ''
      },
    )
    return result
  }

  getExported(
    context: Record<string, unknown> | Callback<Record<string, unknown>> = {},
    parentFrame?: any,
    callback?: Callback<Record<string, unknown>>,
  ): void {
    if (typeof context === 'function') {
      callback = context
      context = {}
    }
    if (typeof parentFrame === 'function') {
      callback = parentFrame
      parentFrame = undefined
    }
    const templateContext = new TemplateContext(
      context,
      this.#blocks,
      this.environment,
    )
    const frame = parentFrame ? parentFrame.push() : new runtime.Frame()
    frame.topLevel = true
    this.#root(this.environment, templateContext, frame, runtime, (error) => {
      if (!callback) {
        if (error) throw error
        return
      }
      callback(error, error ? null : templateContext.getExported())
    })
  }
}

export class PrecompiledTemplateEnvironment {
  readonly opts = {
    autoescape: false,
    dev: false,
    throwOnUndefined: false,
    trimBlocks: false,
    lstripBlocks: false,
  }
  readonly globals = createGlobals()
  readonly #filters: Record<string, (...args: any[]) => any> = { ...filters }
  readonly #tests: Record<string, (...args: any[]) => any> = { ...tests }
  readonly #cache = new Map<string, PrecompiledTemplate>()

  constructor(
    readonly templates: Readonly<Record<string, WorkerCompiledTemplate>>,
  ) {}

  addFilter(name: string, filter: (...args: any[]) => any): this {
    this.#filters[name] = filter
    return this
  }
  getFilter(name: string): (...args: any[]) => any {
    const filter = this.#filters[name]
    if (!filter) throw new Error(`filter not found: ${name}`)
    return filter
  }
  getTest(name: string): (...args: any[]) => any {
    const test = this.#tests[name]
    if (!test) throw new Error(`test not found: ${name}`)
    return test
  }
  waterfall(
    tasks: ReadonlyArray<(...args: any[]) => void>,
    callback: (...args: any[]) => void,
    forceAsync?: boolean,
  ): void {
    runWaterfall(tasks, callback, forceAsync)
  }

  getTemplate(
    rawName: string | { raw: string },
    eagerCompile?: boolean | Callback<PrecompiledTemplate>,
    parentName?: string | Callback<PrecompiledTemplate>,
    ignoreMissing = false,
    callback?: Callback<PrecompiledTemplate>,
  ): PrecompiledTemplate | undefined {
    let name = typeof rawName === 'string' ? rawName : rawName.raw
    if (typeof eagerCompile === 'function') callback = eagerCompile
    if (typeof parentName === 'function') callback = parentName
    name = resolveRelativeName(
      typeof parentName === 'string' ? parentName : '',
      name,
    )
    let template = this.#cache.get(name)
    const props = this.templates[name]
    if (!template && props) {
      template = new PrecompiledTemplate(props, this, name)
      this.#cache.set(name, template)
    }
    if (!template && ignoreMissing) {
      template = new PrecompiledTemplate(
        { root: (_env, _context, _frame, _runtime, cb) => cb(null, '') },
        this,
        name,
      )
    }
    if (!template) {
      const error = new Error(`template not found: ${name}`)
      if (callback) {
        callback(error)
        return undefined
      }
      throw error
    }
    if (callback) callback(null, template)
    return template
  }

  render(
    name: string,
    context: Record<string, unknown> = {},
    callback?: Callback<string>,
  ): string {
    const template = this.getTemplate(name)!
    return template.render(context, callback) ?? ''
  }
}
