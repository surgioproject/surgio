import { PackageJson } from 'type-fest'

export { isZodError, isSurgioError, SurgioError } from './utils'
export * from './utils/cache'
export * from './types'

export const packageJson = require('../package.json') as PackageJson
