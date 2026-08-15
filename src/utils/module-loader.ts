import { createRequire } from 'node:module'

const requireModule = createRequire(import.meta.url)

export const loadModuleSync = <T>(moduleId: string): T => {
  const loadedModule = requireModule(moduleId)

  if (
    loadedModule &&
    typeof loadedModule === 'object' &&
    loadedModule.__esModule &&
    'default' in loadedModule
  ) {
    return loadedModule.default as T
  }

  return loadedModule as T
}
