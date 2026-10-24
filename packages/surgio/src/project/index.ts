export * from './core.js'
export type * from './types.js'
export * from './authoring.js'

export const loadSurgioProject = async (
  cwd: string,
  options?: import('./node.js').LoadSurgioProjectOptions,
) => {
  const { loadSurgioProject: load } = await import('./node.js')
  return load(cwd, options)
}

export type { LoadedSurgioProject, LoadSurgioProjectOptions } from './node.js'
