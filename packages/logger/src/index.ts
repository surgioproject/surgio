import { createConsola } from 'consola/core'

import type { ConsolaReporter, LogObject } from 'consola/core'

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug'

export interface Logger {
  debug(message: unknown, ...args: unknown[]): void
  info(message: unknown, ...args: unknown[]): void
  warn(message: unknown, ...args: unknown[]): void
  error(message: unknown, ...args: unknown[]): void
}

export interface CreateLoggerOptions {
  readonly service?: string
}

type RuntimeProcess = {
  readonly env?: Readonly<Record<string, string | undefined>>
  readonly stderr?: { readonly isTTY?: boolean }
}

const LOG_LEVEL_VALUES: Readonly<Record<LogLevel, number>> = {
  silent: -1,
  error: 0,
  warn: 1,
  info: 3,
  debug: 4,
}

const LEVEL_COLORS: Readonly<Record<Exclude<LogLevel, 'silent'>, number>> = {
  error: 31,
  warn: 33,
  info: 32,
  debug: 34,
}

const runtimeProcess = (): RuntimeProcess | undefined =>
  (globalThis as typeof globalThis & { process?: RuntimeProcess }).process

const normalizeLogLevel = (value?: string): LogLevel => {
  switch (value?.toLowerCase()) {
    case 'silent':
    case 'error':
    case 'warn':
    case 'info':
    case 'debug':
      return value.toLowerCase() as LogLevel
    case 'http':
      return 'info'
    case 'verbose':
    case 'silly':
      return 'debug'
    default:
      return 'info'
  }
}

let activeLogLevel = normalizeLogLevel(
  runtimeProcess()?.env?.SURGIO_LOG_LEVEL,
)

export const setLogLevel = (level: LogLevel): void => {
  activeLogLevel = level
}

const pad = (value: number): string => String(value).padStart(2, '0')

const formatTimestamp = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

const stringifyJson = (value: unknown): string => {
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return '[Circular]'
  }
}

const normalizeJsonPlaceholders = (
  message: string,
  args: unknown[],
): { message: string; args: unknown[] } => {
  let index = 0
  const forwarded: unknown[] = []
  const normalized = message.replace(/%[sdifjoOc%]/g, (placeholder) => {
    if (placeholder === '%%' || index >= args.length) return placeholder
    const value = args[index++]
    if (placeholder === '%j') return stringifyJson(value)
    forwarded.push(value)
    return placeholder
  })

  return { message: normalized, args: [...forwarded, ...args.slice(index)] }
}

const shouldUseColor = (): boolean => {
  const process = runtimeProcess()
  return process?.env?.NODE_ENV !== 'production' && process?.stderr?.isTTY === true
}

const formatLevel = (level: Exclude<LogLevel, 'silent'>): string =>
  shouldUseColor()
    ? `\u001B[${LEVEL_COLORS[level]}m${level}\u001B[39m`
    : level

const consoleMethod = (
  level: Exclude<LogLevel, 'silent'>,
): ((...args: unknown[]) => void) => {
  const method = console[level]
  return typeof method === 'function'
    ? method.bind(console)
    : console.log.bind(console)
}

const reporter: ConsolaReporter = {
  log(logObject: LogObject): void {
    if (logObject.level > LOG_LEVEL_VALUES[activeLogLevel]) return
    const level = logObject.type as Exclude<LogLevel, 'silent'>
    const prefix = `${formatTimestamp(logObject.date)}${logObject.tag ? ` [${logObject.tag}]` : ''} ${formatLevel(level)}:`
    const [message, ...args] = logObject.args as unknown[]
    const output = consoleMethod(level)

    if (typeof message === 'string') {
      const normalized = normalizeJsonPlaceholders(message, args)
      output(`${prefix} ${normalized.message}`, ...normalized.args)
    } else if (message === undefined) {
      output(prefix)
    } else {
      output(prefix, message, ...args)
    }
  },
}

export const createLogger = (options: CreateLoggerOptions = {}): Logger =>
  createConsola({
    defaults: options.service ? { tag: options.service } : undefined,
    level: LOG_LEVEL_VALUES.debug,
    reporters: [reporter],
    throttle: 0,
  })

export const logger = createLogger({
  service: 'surgio',
})
