import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createLogger, logger, setLogLevel } from './index.js'

const timestamp = (date: Date): string =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-') +
  ' ' +
  [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join(':')

const now = new Date('2026-08-18T12:34:56.000Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(now)
  vi.stubEnv('NODE_ENV', 'production')
  setLogLevel('info')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

it('formats logs with a timestamp, service, level, and printf arguments', () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const serviceLogger = createLogger({ service: 'test service' })

  serviceLogger.info('loaded %s %j', 'provider', { count: 2 })

  expect(info).toHaveBeenCalledWith(
    `${timestamp(now)} [test service] info: loaded %s {"count":2}`,
    'provider',
  )
})

it('omits the service label when none is configured', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

  createLogger().warn('test warning')

  expect(warn).toHaveBeenCalledWith(`${timestamp(now)} warn: test warning`)
})

it('routes each supported level to the matching console method', () => {
  const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
  const info = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

  setLogLevel('debug')
  const instance = createLogger({ service: 'levels' })
  instance.debug('debug')
  instance.info('info')
  instance.warn('warn')
  instance.error('error')

  expect(debug).toHaveBeenCalledOnce()
  expect(info).toHaveBeenCalledOnce()
  expect(warn).toHaveBeenCalledOnce()
  expect(error).toHaveBeenCalledOnce()
})

it('changes the level for existing and future loggers', () => {
  const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
  const info = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  const existing = createLogger()

  setLogLevel('warn')
  existing.debug('hidden')
  existing.info('hidden')
  existing.warn('shown')
  createLogger().info('also hidden')

  expect(debug).not.toHaveBeenCalled()
  expect(info).not.toHaveBeenCalled()
  expect(warn).toHaveBeenCalledOnce()
})

it('can silence every logger', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

  setLogLevel('silent')
  logger.error('hidden')

  expect(error).not.toHaveBeenCalled()
})

it('forwards Error objects so the runtime can render their stacks', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const cause = new Error('boom')

  createLogger().error('request failed', cause)

  expect(error).toHaveBeenCalledWith(
    `${timestamp(now)} error: request failed`,
    cause,
  )
})

describe('environment defaults', () => {
  it.each([
    ['http', false],
    ['verbose', true],
    ['silly', true],
    ['invalid', false],
  ])('maps SURGIO_LOG_LEVEL=%s', async (level, debugVisible) => {
    vi.stubEnv('SURGIO_LOG_LEVEL', level)
    vi.resetModules()
    const isolated = await import('./index.js')
    const debug = vi
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined)

    isolated.createLogger().debug('debug')

    expect(debug).toHaveBeenCalledTimes(debugVisible ? 1 : 0)
  })
})

it('colors the level only for an interactive Node development terminal', () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const isTTY = Object.getOwnPropertyDescriptor(process.stderr, 'isTTY')
  vi.stubEnv('NODE_ENV', 'development')
  Object.defineProperty(process.stderr, 'isTTY', {
    configurable: true,
    value: true,
  })

  try {
    createLogger().info('colored')
    expect(info).toHaveBeenCalledWith(
      `${timestamp(now)} \u001B[32minfo\u001B[39m: colored`,
    )
  } finally {
    if (isTTY) Object.defineProperty(process.stderr, 'isTTY', isTTY)
    else Reflect.deleteProperty(process.stderr, 'isTTY')
  }
})
