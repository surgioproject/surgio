import { PackageJson } from 'type-fest'

import packageJsonValue from '../package.json' with { type: 'json' }

export { isZodError, isSurgioError, SurgioError } from './utils/index.js'
export * from './cache/index.js'
export * from './cache/singleton.js'
export * from './types.js'

export const packageJson = packageJsonValue as PackageJson
