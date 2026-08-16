import os from 'node:os'
import { join } from 'node:path'
import fs from 'fs-extra'

import { getIsGFWFree } from './env-flag.js'

export * from './portable.js'
export * from './surge.js'
export * from './surfboard.js'
export * from './clash.js'
export * from './singbox.js'
export * from './quantumult.js'
export * from './loon.js'
export * from './remote-snippet.js'
export * from './subscription.js'
export * from './time.js'
export * from './errors.js'
export * from './env-flag.js'
export { default as httpClient } from './http-client.js'

export const ensureConfigFolder = (dir: string = os.homedir()): string => {
  let baseDir

  try {
    fs.accessSync(dir, fs.constants.W_OK)
    baseDir = dir
  } catch {
    /* istanbul ignore next -- @preserve */
    baseDir = '/tmp'
  }

  const configDir = join(baseDir, '.config/surgio')
  fs.mkdirpSync(configDir)
  return configDir
}

/* istanbul ignore next -- @preserve */
export const isNow = (): boolean =>
  typeof process.env.NOW_REGION !== 'undefined' ||
  typeof process.env.VERCEL_REGION !== 'undefined'

/* istanbul ignore next -- @preserve */
export const isVercel = (): boolean => isNow()

/* istanbul ignore next -- @preserve */
export const isHeroku = (): boolean => typeof process.env.DYNO !== 'undefined'

/* istanbul ignore next -- @preserve */
export const isGitHubActions = (): boolean =>
  typeof process.env.GITHUB_ACTIONS !== 'undefined'

/* istanbul ignore next -- @preserve */
export const isGitLabCI = (): boolean =>
  typeof process.env.GITLAB_CI !== 'undefined'

/* istanbul ignore next -- @preserve */
export const isRailway = (): boolean =>
  typeof process.env.RAILWAY_STATIC_URL !== 'undefined'

/* istanbul ignore next -- @preserve */
export const isNetlify = (): boolean =>
  typeof process.env.NETLIFY !== 'undefined'

/* istanbul ignore next -- @preserve */
export const isAWSLambda = (): boolean =>
  typeof process.env.AWS_LAMBDA_FUNCTION_NAME !== 'undefined'

/* istanbul ignore next -- @preserve */
export const isAWS = (): boolean =>
  isAWSLambda() ||
  typeof process.env.AWS_EXECUTION_ENV !== 'undefined' ||
  typeof process.env.AWS_REGION !== 'undefined'

/* istanbul ignore next -- @preserve */
export const isFlyIO = (): boolean =>
  typeof process.env.FLY_REGION !== 'undefined'

/* istanbul ignore next -- @preserve */
export const isGFWFree = (): boolean =>
  getIsGFWFree() ||
  isAWS() ||
  isAWSLambda() ||
  isVercel() ||
  isHeroku() ||
  isGitHubActions() ||
  isGitLabCI() ||
  isRailway() ||
  isNetlify() ||
  isFlyIO()
