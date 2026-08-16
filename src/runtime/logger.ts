import type { RuntimeLogger } from './types.js'

const noop = (): void => {}

const nativeConsoleLogger: RuntimeLogger = {
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
}

let defaultRuntimeLogger = nativeConsoleLogger

export const silentRuntimeLogger: RuntimeLogger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
}

export const consoleRuntimeLogger: RuntimeLogger = {
  debug: (message, ...args) => defaultRuntimeLogger.debug(message, ...args),
  info: (message, ...args) => defaultRuntimeLogger.info(message, ...args),
  warn: (message, ...args) => defaultRuntimeLogger.warn(message, ...args),
  error: (message, ...args) => defaultRuntimeLogger.error(message, ...args),
}

export const setDefaultRuntimeLogger = (logger: RuntimeLogger): void => {
  defaultRuntimeLogger = logger
}

export const withRuntimeLogger = <T>(
  logger: RuntimeLogger,
  callback: () => T,
): T => {
  const previousLogger = defaultRuntimeLogger
  defaultRuntimeLogger = logger
  try {
    return callback()
  } finally {
    defaultRuntimeLogger = previousLogger
  }
}
